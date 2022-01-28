const fetch = require('node-fetch')
const morph = require('../util/fetch-morph.js')

const dlRegex = /\?dl\=0|$/

class InactivityBuster {
  constructor (options, client, guild, apiurl, dbtoken, dbpath) {
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
    this._dbtoken = dbtoken
    this._dbpath = dbpath

    this.lastMessageTimestamp = Date.now()
    this.instanceCount = 0
    this.lastMemeType = false

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

      if (!this.lastMemeType) {
        this.lastMemeType = !this.lastMemeType

        return fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            Authorization: this._dbtoken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: this._dbpath
          })
        })
          .then((files) => morph(files, 'json'))
          .then(({ entries: files }) => {
            const index = Math.round(Math.random() * files.length) 0

            return fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
              method: 'POST',
              headers: {
                Authorization: this._dbtoken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: files[index].path_lower,
                settings: {
                  audience: 'public',
                  access: 'viewer',
                  allow_download: true
                }
              })
            })
              .then((file) => morph(file, 'json'))
              .then((file) => this.sendMeme({
                title: file.name,
                url: file.url.replace(dlRegex, '?raw=1')
              }))

              .catch((res) => res.status === 409
                ? fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
                  method: 'POST',
                  headers: {
                    Authorization: this._dbtoken,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    path: files[index].path_lower,
                    direct_only: true
                  })
                })
                  .then((links) => morph(links, 'json'))
                  .then(({ links: [file] }) => this.sendMeme({
                    title: file.name,
                    url: file.url.replace(dlRegex, '?raw=1')
                  }))

                  .catch(console.error)
                : console.error(res))
          })

          .catch(console.error)
      } else {
        return fetch(this._apiurl)
          .then((meme) => morph(meme, 'json'))
          .then(this.sendMeme)

          .catch(console.error)
      }
    }
  }

  sendMeme (meme) {
    const channels = this._client.guilds.get(this._guild).channels.filter((c) => c.permissionsOf(this._client.user.id).has('sendMessages') &&
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
          footer: meme.author
            ? {
                text: `Posted by ${meme.author} in r/${meme.subreddit}`
              }
            : undefined
        }
      })
    } else console.warn('NO CHANNEL FOUND WITH PERMISSIONS')
  }
}

module.exports = InactivityBuster
