const promisify = (fn) => (...args) =>
  new Promise((resolve, reject) => {
    try {
      fn(...args, (err, res) => {
        if (err) reject(err)
        else resolve(res)
      })
    } catch (err) {
      reject(err)
    }
  })

module.exports = promisify
