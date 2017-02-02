var low = require('last-one-wins')
var fs = require('fs')
var debug = require('debug')('toiletdb')

module.exports = function (filename) {
  var state = {}

  var write = low(function (writeState, cb) {
    var payload = JSON.stringify(writeState, null, '  ')
    debug('writing', filename, payload)
    var tmpname = filename + '.' + Math.random();
    fs.writeFile(tmpname, payload, function(err) {
      if(err) {
        return fs.unlink(tmpname, function () {
          cb(err);
        });
      }
      fs.rename(tmpname, filename, cb);
    })
  })

  return {
    read: function (cb) {
      fs.readFile(filename, function (err, buf) {
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
          debug('reading', filename, jsonString)
        } catch (e) {
          return cb(e)
        }
        cb(null, state)
      })
    },
    write: function (key, data, cb) {
      if (Buffer.isBuffer(key)) key = key.toString('hex')
      if (Buffer.isBuffer(data)) data = data.toString('hex')
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
