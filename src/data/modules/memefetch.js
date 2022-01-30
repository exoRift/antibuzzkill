const fetch = require('node-fetch')
const morph = require('../util/fetch-morph.js')

const methods = {
  dropbox: (token, path) => {
    return fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: path
      })
    })
      .then((files) => morph(files, 'json'))
      .then(({ entries: files }) => {
        const index = Math.round(Math.random() * files.length)

        return fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
          method: 'POST',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: files[index].path_lower,
            direct_only: true
          })
        })
          .then((links) => morph(links, 'json'))
          .then(({ links: [file] }) => file || fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
            method: 'POST',
            headers: {
              Authorization: token,
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
            .then((file) => morph(file, 'json')))
      })
  },

  reddit: () => fetch('https://meme-api.herokuapp.com/gimme')
    .then((meme) => morph(meme, 'json'))
}

module.exports = methods
