const {
  google
} = require('googleapis')
const sheets = google.sheets('v4')

const scopes = ['https://www.googleapis.com/auth/spreadsheets']

class QOTDManager {
  constructor (client, spreadsheet, channel) {
    this._client = client
    this._spreadsheet = spreadsheet
    this._channel = channel
  }

  _getAuth () {
    const auth = new google.auth.GoogleAuth({
      keyFile: './service_account_credentials.json',
      scopes
    })

    return auth.getClient()
  }

  _calcTimeUntilNoon () {
    const current = new Date()
    const desired = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + (current.getHours() <= 12 ? 0 : 1),
      12 /* Noon */
    )

    return desired.getTime() - current.getTime()
  }

  async init () {
    this._token = await this._getAuth()

    const wait = this._calcTimeUntilNoon()

    this.timeout = setTimeout(this.announce.bind(this), wait)

    console.info(`Next Question Of The Day scheduled ${Math.floor(wait / 3600000)} hour(s) from now`)
  }

  async announce () {
    this.timeout = setTimeout(this.announce.bind(this), 86400000 /* 24 hours */)

    const sheet = await sheets.spreadsheets.get({
      auth: this._token,
      spreadsheetId: this._spreadsheet,
      includeGridData: true
    })

    const index = sheet.data.sheets[0].data[0].rowData.findIndex((r, i) => i &&
      r.values[2].effectiveFormat.backgroundColor.green &&
      r.values[2].effectiveFormat.backgroundColor.blue)
    const question = sheet.data.sheets[0].data[0].rowData[index]

    return this._client.createMessage(this._channel, `QOTD: __**${question.values[2].effectiveValue.stringValue}**__`)
      .then(() => sheets.spreadsheets.batchUpdate({
        auth: this._token,
        spreadsheetId: this._spreadsheet,
        resource: {
          requests: [{
            updateCells: {
              range: {
                sheetId: 782913829,
                startRowIndex: index,
                endRowIndex: index + 1,
                startColumnIndex: 2,
                endColumnIndex: 3
              },
              fields: 'userEnteredFormat',
              rows: [{
                values: [{
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 1,
                      green: 0,
                      blue: 0
                    }
                  }
                }]
              }]
            }
          }]
        }
      }))
  }
}

module.exports = QOTDManager
