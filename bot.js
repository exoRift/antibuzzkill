const Eris = require('eris')
const {
  Agent
} = require('cyclone-engine')

const commands = require('./src/data/commands/')
const {
  onMessage
} = require('./src/data/listeners/')
const {
  InactivityBuster
} = require('./src/data/modules/')

const {
  TOKEN,
  PREFIX,
  RANGEMIN,
  RANGEMAX,
  INSTANCE_MAX,
  GUILD,
  API_URL
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

agent.attach('inacbuster', new InactivityBuster(inacOptions, agent.client, GUILD, API_URL))

agent.connect()
