const {
  Command
} = require('cyclone-engine')

const {
  DROPBOX_TOKEN,
  DROPBOX_PATH
} = process.env

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
        console.log(meme)
      })
      .catch(console.error)
  }
}

module.exports = new Command(data)
