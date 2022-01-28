async function morph (res, type) {
  if (res.ok) return res[type]()
  else {
    const err = {
      status: res.status,
      content: res.status === 400 ? await res.text() : await res[type]()
    }

    throw err
  }
}

module.exports = morph
