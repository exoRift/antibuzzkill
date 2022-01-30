const Eris = require('eris')
const {
  Agent
} = require('cyclone-engine')

const commands = require('./src/data/commands/')
const {
  onMessage
} = require('./src/data/listeners/')
const {
  inactivitybuster: InactivityBuster,
  memefetch
} = require('./src/data/modules/')

const {
  TOKEN,
  PREFIX,
  RANGEMIN,
  RANGEMAX,
  INSTANCE_MAX,
  GUILD,
  DROPBOX_TOKEN,
  DROPBOX_PATH
} = process.env

const agent = new Agent({
  Eris,
  token: TOKEN,
  handlerData: {
    commands,
    reactCommands: [], // Necessary to initialize handler
    options: {
      prefix: PREFIX
    }
  },
  options: {
    postEventFunctions: {
      message: (msg) => onMessage(agent, msg)
    }
  }
})

const inacOptions = {
  min: RANGEMIN,
  max: RANGEMAX,
  maxPerInstance: INSTANCE_MAX
}

agent.attach('inacbuster', new InactivityBuster(inacOptions, agent.client, GUILD, DROPBOX_TOKEN, DROPBOX_PATH))
agent.attach('memefetch', memefetch)

agent.connect()
