function onMessage (agent, msg) {
  agent.attachments.inacbuster.refreshTimestamp()
}

module.exports = onMessage
