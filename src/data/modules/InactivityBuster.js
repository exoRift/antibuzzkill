const fetch = require('node-fetch')

class InactivityBuster {
  constructor (options, client, guild, apiurl) {
    const {
      min,
      max,
      maxPerInstance
    } = options

    this._min = min
    this._max = max
    this._maxPerInstance = maxPerInstance
    this._client = client
    this._guild = guild
    this._apiurl = apiurl

    this.lastMessageTimestamp = Date.now()
    this.instanceCount = 0

    this.timeout = setTimeout(this.action.bind(this), this.getRandInterval())
  }

  getRandInterval () {
    return Math.random() * (this._max - this._min) + this._min
  }

  refreshTimestamp (inactivity) {
    this.lastMessageTimestamp = Date.now()
    this.instanceCount = inactivity ? this.instanceCount + 1 : 0

    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.action.bind(this), this.getRandInterval())
  }

  action () {
    if (this.instanceCount <= this._maxPerInstance) {
      this.refreshTimestamp(true)

      return fetch(this._apiurl)
        .then((meme) => meme.json())
        .then((meme) => {
          const channels = this._client.guilds.get(this._guild).channels.filter((c) => c.permissionsOf(this._client.user.id).has('sendMessages') &&
            !c.type)
          const channel = channels[parseInt(Math.random() * (channels.length - 1))]

          if (channel) {
            return channel.createMessage({
              embed: {
                author: {
                  name: 'This server is too silent... Discuss this meme!'
                },
                title: meme.title,
                url: meme.postLink,
                color: Math.random() * 0xffffff,
                image: {
                  url: meme.url
                },
                footer: {
                  text: `Posted by ${meme.author} in r/${meme.subreddit}`
                }
              }
            })
          } else console.warn('NO CHANNEL FOUND WITH PERMISSIONS')
        })

        .catch(console.error)
    }
  }
}

module.exports = InactivityBuster
