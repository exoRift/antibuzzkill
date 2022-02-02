const {
  Command
} = require('cyclone-engine')

const {
  DROPBOX_TOKEN,
  DROPBOX_PATH
} = process.env

const dlRegex = /\?dl=0|$/

const data = {
  name: 'meme',
  desc: 'Query a meme from either Reddit or the custom Dropbox',
  options: {
    args: [{ name: 'source' }]
  },
  action: ({ agent, msg, args: [source] }) => {
    if (!(source in agent.attachments.memefetch)) {
      const sources = Object.keys(agent.attachments.memefetch)

      source = sources[Math.round(Math.random() * (sources.length - 1))]
    }

    return agent.attachments.memefetch[source](DROPBOX_TOKEN, DROPBOX_PATH)
      .then((meme) => {
        return {
          embed: {
            author: {
              name: 'Meme queried by ' + msg.author.username
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
        }
      })
      .catch(console.error)
  }
}

module.exports = new Command(data)
