const {
  google
} = require('googleapis')
const sheets = google.sheets('v4')
const memefetch = require('./memefetch.js')

const {
  DROPBOX_TOKEN,
  DROPBOX_PATH,
  FILLER_CHANNELS,
  MEME_CHANNELS,
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY
} = process.env

const dlRegex = /\?dl=0|$/
const scopes = ['https://www.googleapis.com/auth/spreadsheets']

class Scheduler {
  constructor (client, spreadsheet, channel) {
    this._client = client
    this._spreadsheet = spreadsheet
    this._qotdChannel = channel
  }

  _getAuth () {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY
      },
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

  _getRandomTime (tomorrow) {
    const current = new Date()
    const midnight = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + (tomorrow ? 1 : 0),
      24 /* midnight */
    )
    const difference = midnight.getTime() - current.getTime()

    return Math.round(Math.random() * difference)
  }

  async init () {
    this._token = await this._getAuth()

    const qotdWait = this._calcTimeUntilNoon()
    const fillerWait = this._getRandomTime(false)
    const memeWait = this._getRandomTime(false)

    this.qotdTimeout = setTimeout(this.announce.bind(this), qotdWait)
    this.fillerTimeout = setTimeout(this.filler.bind(this), fillerWait)
    this.memeTimeout = setTimeout(this.filler.bind(this), memeWait)

    console.info(`Next Question Of The Day scheduled ${Math.floor(qotdWait / 3600000)} hour(s) from now`)
  }

  async announce () {
    this.qotdTimeout = setTimeout(this.announce.bind(this), 86400000 /* 24 hours */)

    const sheet = await sheets.spreadsheets.get({
      auth: this._token,
      spreadsheetId: this._spreadsheet,
      includeGridData: true
    })

    const index = sheet.data.sheets[0].data[0].rowData.findIndex((r, i) => i &&
      r.values[2].effectiveFormat.backgroundColor.green &&
      r.values[2].effectiveFormat.backgroundColor.blue)
    const question = sheet.data.sheets[0].data[0].rowData[index]

    return this._client.createMessage(this._qotdChannel, `QOTD: __**${question.values[2].effectiveValue.stringValue}**__`)
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

  async filler () {
    const fillerWait = this._getRandomTime(true)
    this.fillerTimeout = setTimeout(this.filler.bind(this), fillerWait)

    const sheet = await sheets.spreadsheets.get({
      auth: this._token,
      spreadsheetId: this._spreadsheet,
      includeGridData: true
    })

    const index = Math.round(Math.random() * (sheet.data.sheets[1].data[0].rowData.length - 1))
    const statement = sheet.data.sheets[1].data[0].rowData[index]

    const channels = FILLER_CHANNELS.split(' ')
    const channel = channels[Math.round(Math.random() * (channels.length - 1))]

    return this._client.createMessage(channel, statement.values[2].effectiveValue.stringValue)
      .catch(console.error)
  }

  async sendMeme () {
    const memeWait = this._getRandomTime(true)
    this.memeTimeout = setTimeout(this.sendMeme.bind(this), memeWait)

    const sources = Object.keys(memefetch)
    const source = sources[Math.round(Math.random() * (sources.length - 1))]
    const channels = MEME_CHANNELS.split(' ')
    const channel = channels[Math.round(Math.random() * (channels.length - 1))]

    return memefetch[source](DROPBOX_TOKEN, DROPBOX_PATH)
      .then((meme) => this._client.createMessage(channel, {
        embed: {
          author: {
            name: 'Enjoy this random meme'
          },
          title: meme.title,
          url: meme.postLink,
          color: Math.random() * 0xffffff,
          image: {
            url: meme.url.replace(dlRegex, '?raw=1')
          },
          footer: meme.author
            ? {
                text: `Posted by ${meme.author} in r/${meme.subreddit}`
              }
            : undefined
        }
      }))
      .catch(console.error)
  }
}

module.exports = Scheduler
