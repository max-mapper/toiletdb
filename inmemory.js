module.exports = function (state) {
  return {
    read: function (cb) {
      process.nextTick(function () {
        cb(null, state)
      })
    },
    write: function (key, data, cb) {
      if (Buffer.isBuffer(key)) key = key.toString('hex')
      if (Buffer.isBuffer(data)) data = data.toString('hex')
      state[key] = data || null
      process.nextTick(cb)
    },
    delete: function (key, cb) {
      delete state[key]
      process.nextTick(cb)
    }
  }
}