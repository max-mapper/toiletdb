var low = require('last-one-wins')
var xtend = require('xtend')
var fs = require('fs')
var debug = require('debug')('toiletdb')

module.exports = function (filename) {
  var state = {}

  var rawwrite = low(function (writeState, cb) {
    var payload = JSON.stringify(writeState, null, '  ')
    debug('writing', filename, payload)
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
    update: update,
    read: read,
    write: write,
    delete: del
  }

  function update (key, data, cb) {
    read(function (err, old) {
      if (err) return cb(err)
      var obj = xtend(old[key], data)
      write(key, obj, cb)
    })
  }

  function read (cb) {
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
  }

  function write (key, data, cb) {
    if (Buffer.isBuffer(key)) key = key.toString('hex')
    if (Buffer.isBuffer(data)) data = data.toString('hex')
    state[key] = data || null
    rawwrite(state, cb)
  }

  function del (key, cb) {
    if (Buffer.isBuffer(key)) key = key.toString('hex')
    delete state[key]
    rawwrite(state, cb)
  }
}
