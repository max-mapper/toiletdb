var low = require('last-one-wins')
var fs = require('fs')
var path = require('path')
var debug = require('debug')('toiletdb')

module.exports = function (filename) {
  // in memory copy of latest state that functions below mutate
  var state = {}
  var db = parse(filename)
  var writeTemp = (typeof filename === 'string') // Only use temp for regular fs. Could expose as option

  // `low` ensures if write is called multiple times at once the last one will be executed
  // last and call the callback. this works OK because we have `state` above
  var write = low(function (writeState, cb) {
    var payload = JSON.stringify(writeState, null, '  ') // pretty printed
    debug('writing', db.name, payload)

    if (writeTemp) {
      // write to tempfile first so we know it fully writes to disk and doesnt corrupt existing file
      var tmpname = db.name + '.' + Math.random()
      db.fs.writeFile(tmpname, payload, function (err) {
        if (err) {
          return db.fs.unlink(tmpname, function () {
            cb(err)
          })
        }
        db.fs.stat(db.name, function (err) {
          if (err) return rename(null)
          db.fs.unlink(db.name, rename)
        })

        function rename (err) {
          if (err) return cb(err)
          db.fs.rename(tmpname, db.name, cb)
        }
      })
    } else {
      db.fs.writeFile(db.name, payload, cb)
    }
  })

  return {
    open: function (cb) {
      db.fs.readFile(db.name, function (err, buf) {
        if (err) return cb()
        try {
          // if youre using toiletdb your db needs to fit in a single string
          state = JSON.parse(buf.toString())
        } catch (_) {
        }
        cb()
      })
    },
    read: function (key, cb) {
      if (typeof key === 'function') {
        cb = key
        key = null
      }

      db.fs.readFile(db.name, function (err, buf) {
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
          debug('reading', db.name, jsonString)
          return cb(null, select(parsed))
        } catch (e) {
          return cb(e)
        }

        function select (obj) {
          return key ? obj[key] : obj
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
    },
    flush: function (cb) {
      state = {}
      db.fs.unlink(db.name, cb)
    },
    flushSync: function () {
      state = {}
      db.fs.unlinkSync(db.name)
    }
  }

  function parse (name) {
    if (typeof name === 'string') return {name: path.resolve(name), fs: fs}
    name.name = path.resolve(name.name)
    if (!name.fs) name.fs = fs
    return name
  }
}
