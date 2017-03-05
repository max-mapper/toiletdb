var low = require('last-one-wins')
var fs = require('fs')
var debug = require('debug')('toiletdb')

module.exports = function (filename) {
  // in memory copy of latest state that functions below mutate
  var state = {}

  // `low` ensures if write is called multiple times at once the last one will be executed
  // last and call the callback. this works OK because we have `state` above
  var write = low(function (writeState, cb) {
    var payload = JSON.stringify(writeState, null, '  ') // pretty printed
    debug('writing', filename, payload)
    
    // write to tempfile first so we know it fully writes to disk and doesnt corrupt existing file
    var tmpname = filename + '.' + Math.random()
    fs.writeFile(tmpname, payload, function (err) {
      if (err) {
        return fs.unlink(tmpname, function () {
          cb(err)
        })
      }
      fs.rename(tmpname, filename, cb)
    })
  })

  return {
    read: function (key, cb) {
      if (typeof key === 'function') {
        cb = key
        key = null
      }
      function select (obj) {
        return key ? obj[key] : obj
      }
      fs.readFile(filename, function (err, buf) {
        if (err) {
          if (err.code === 'ENOENT') {
            // if you read before ever writing
            return cb(null, select(state))
          } else {
            return cb(err)
          }
        }
        try {
          // if youre using toiletdb your db needs to fit in a single string
          var jsonString = buf.toString()
          var parsed = JSON.parse(jsonString)
          debug('reading', filename, jsonString)
          return cb(null, select(parsed))
        } catch (e) {
          return cb(e)
        }
      })
    },
    write: function (key, data, cb) {
      // json doesnt support binary
      if (Buffer.isBuffer(key)) key = key.toString('hex')
      if (Buffer.isBuffer(data)) data = data.toString('hex')
      // the '|| null' is because JSON.stringify deletes keys with `undefined` values
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
