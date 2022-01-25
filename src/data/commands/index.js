const massRequire = require('mass-require')

module.exports = massRequire.toArray(__dirname, {
  exclude: /^index\.js$/
})
