module.exports = function (state) {
  state = state || {}
  return {
    open: function (cb) {
      process.nextTick(cb)
    },
    read: function (key, cb) {
      if (typeof key === 'function') {
        cb = key
        key = null
      }
      process.nextTick(function () {
        var selected = key ? state[key] : state
        cb(null, selected)
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
    },
    flush: function (cb) {
      state = {}
      process.nextTick(cb)
    },
    flushSync: function () {
      state = {}
    }
  }
}
