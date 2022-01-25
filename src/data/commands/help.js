const path = require('path')

const {
  SUPPORT_SERVER,
  PREFIX
} = process.env

const {
  Command,
  Await
} = require('cyclone-engine')

function pickMenu (agent, page = 1) {
  if (!isNaN(parseInt(page))) { // Help menu
    const pkg = require(path.join(process.cwd(), '/package.json'))

    const helpMenuData = {
      desc: `${agent.client.user.username} prevents those pesky lurkers from killing the vibe`,
      serverCode: SUPPORT_SERVER,
      color: 0x80FF,
      version: pkg.version
    }

    const {
      embed,
      options: {
        reactInterface
      }
    } = agent.buildHelp(helpMenuData, page)
    if (reactInterface) reactInterface._options.deleteAfterUse = true

    const wait = new Await({
      time: 15000,
      options: {
        check: (msg) => msg.content.startsWith(PREFIX + 'help'),
        args: [{ name: 'page #' }],
        refreshOnUse: true,
        requirePrefix: true,
        shouldShift: true
      },
      action: ({ args: [page], triggerResponse }) => {
        const response = pickMenu(agent, page)

        triggerResponse.edit(response)
      }
    })

    return {
      embed,
      options: {
        awaits: wait,
        reactInterface
      }
    }
  } else { // Command guide
    const embed = agent.buildCommandGuide(page)

    return {
      embed
    }
  }
}

const data = {
  name: 'help',
  desc: 'Display this menu',
  options: {
    args: [{ name: 'page #/command name' }]
  },
  action: ({ agent, args: [page] }) => {
    return pickMenu(agent, page)
  }
}

module.exports = new Command(data)