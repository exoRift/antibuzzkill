const massRequire = require('mass-require')

module.exports = massRequire.toObject(__dirname, {
  exclude: /^index\.js$/
})
