var low = require('last-one-wins')
var fs = require('fs')
var debug = require('debug')('toiletdb')

module.exports = function (opts) {
  if (typeof opts === 'string') opts = {name: opts}

  var state = {}

  var write = low(function (writeState, cb) {
    var payload = JSON.stringify(writeState)
    debug('writing', opts.name, payload)
    fs.writeFile(opts.name, payload, cb)
  })

  return {
    read: function (cb) {
      fs.readFile(opts.name, function (err, buf) {
        if (err) {
          if (err.code === 'ENOENT') {
            return cb(null, state)
          } else {
            return cb(err)
          }
        }
        try {
          var jsonString = buf.toString()
          state = JSON.parse(jsonString)
          debug('reading', opts.name, jsonString)
        } catch (e) {
          return cb(e)
        }
        cb(null, state)
      })
    },
    write: function (key, data, cb) {
      if (Buffer.isBuffer(key)) key = key.toString('hex')
      state[key] = data || null
      write(state, cb)
    },
    delete: function (key, cb) {
      if (Buffer.isBuffer(key)) key = key.toString('hex')
      delete state[key]
      write(state, cb)
    }
  }
}
