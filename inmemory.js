module.exports = function (state) {
  state = state || {}
  return {
    open: function () {
      return new Promise((resolve, reject) => {
        process.nextTick(resolve)
      })
    },
    read: function (key) {
      return new Promise((resolve, reject) => {
        process.nextTick(() => {
          resolve(key ? state[key] : state)
        })
      })
    },
    write: function (key, data, cb) {
      if (Buffer.isBuffer(key)) key = key.toString('hex')
      if (Buffer.isBuffer(data)) data = data.toString('hex')
      state[key] = data || null
      return new Promise((resolve, reject) => {
        process.nextTick(resolve)
      })
    },
    delete: function (key, cb) {
      delete state[key]
      return new Promise((resolve, reject) => {
        process.nextTick(resolve)
      })
    },
    flush: function (cb) {
      state = {}
      return new Promise((resolve, reject) => {
        process.nextTick(resolve)
      })
    },
    flushSync: function () {
      state = {}
    }
  }
}
