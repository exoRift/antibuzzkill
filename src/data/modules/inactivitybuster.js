const {
  dropbox,
  reddit
} = require('./memefetch.js')

const dlRegex = /\?dl=0|$/

const {
  INACTIVITY_CHANNEL_BLACKLIST
} = process.env

class InactivityBuster {
  constructor (options, client, guild, dbtoken, dbpath) {
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
    this._dbtoken = dbtoken
    this._dbpath = dbpath

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

      if (Math.round(Math.random())) { // Random boolean
        dropbox(this._dbtoken, this._dbpath)
          .then((file) => this.sendMeme({
            title: file.name,
            url: file.url.replace(dlRegex, '?raw=1'),
            footer: 'Custom Dropbox meme'
          }))
          .catch(console.error)
      } else {
        return reddit()
          .then(this.sendMeme.bind(this))
          .catch(console.error)
      }
    }
  }

  sendMeme (meme) {
    const blacklist = INACTIVITY_CHANNEL_BLACKLIST.split(' ')

    const channels = this._client.guilds.get(this._guild).channels.filter((c) => c.permissionsOf(this._client.user.id).has('sendMessages') &&
    !blacklist.includes(c.id) &&
    !c.type)
    const channel = channels[Math.round(Math.random() * (channels.length - 1))]

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
            text: meme.author ? `Posted by ${meme.author} in r/${meme.subreddit}` : meme.footer
          }
        }
      })
    } else console.warn('NO CHANNEL FOUND WITH PERMISSIONS')
  }
}

module.exports = InactivityBuster
