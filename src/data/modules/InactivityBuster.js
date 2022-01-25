const fetch = require('node-fetch')

const extRegex = /\.(.+)$/

class InactivityBuster {
  constructor (min, max, client, guild, apiurl) {
    this._min = min
    this._max = max
    this._client = client
    this._guild = guild
    this._apiurl = apiurl

    this.lastMessageTimestamp = Date.now()

    this.timeout = setTimeout(this.action.bind(this), Math.random() * (max - min) + min)
  }

  refreshTimestamp () {
    this.lastMessageTimestamp = Date.now()

    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.action.bind(this), Math.random() * (this._max - this._min) + this._min)
  }

  action () {
    this.timeout = setTimeout(() => this.action())

    return fetch(this._apiurl)
      .then((meme) => meme.json())
      .then((meme) => fetch(meme.url)
        .then((image) => image.buffer())
        .then((image) => {
          const channels = this._client.guilds.get(this._guild).channels.filter((c) => c.permissionsOf(this._client.user.id).has('sendMessages') &&
            !c.type)
          const channel = channels[parseInt(Math.random() * (channels.length - 1))]

          if (channel) {
            channel.createMessage(meme.title, {
              name: 'meme' + extRegex.exec(meme.url)[1],
              file: image
            })
          } else console.warn('NO CHANNEL FOUND WITH PERMISSIONS')
        }))

      .catch(console.error)
  }
}

module.exports = InactivityBuster
