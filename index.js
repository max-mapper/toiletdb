const low = require('last-one-wins')
const fs = require('fs')
const path = require('path')
const debug = require('debug')('toiletdb')

module.exports = function (filename) {
  // in memory copy of latest state that functions below mutate
  let state = {}
  const db = parse(filename)
  const writeTemp = (typeof filename === 'string') // Only use temp for regular fs. Could expose as option

  // `low` ensures if write is called multiple times at once the last one will be executed
  // last and call the callback. this works OK because we have `state` above
  const write = low(function (writeState, cb) {
    const payload = JSON.stringify(writeState, null, '  ') // pretty printed
    debug('writing', db.name, payload)

    if (writeTemp) {
      // write to tempfile first so we know it fully writes to disk and doesnt corrupt existing file
      const tmpname = db.name + '.' + Math.random()
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
    open: function () {
      return new Promise((resolve, reject) => {
        db.fs.readFile(db.name, function (err, buf) {
          if (err) return resolve() // file does not exist, will write later
          try {
            // if youre using toiletdb your db needs to fit in a single string
            state = JSON.parse(buf.toString())
          } catch (_) {
          }
          resolve()
        })
      })
    },
    read: function (key) {
      return new Promise((resolve, reject) => {
        db.fs.readFile(db.name, function (err, buf) {
          if (err) {
            if (err.code === 'ENOENT') {
              // if you read before ever writing
              return resolve(select(state))
            } else {
              return reject(err)
            }
          }

          try {
            // if youre using toiletdb your db needs to fit in a single string
            var jsonString = buf.toString()
            var parsed = JSON.parse(jsonString)
            debug('reading', db.name, jsonString)
            return resolve(select(parsed))
          } catch (e) {
            return reject(e)
          }

          function select (obj) {
            return key ? obj[key] : obj
          }
        })
      })
    },
    write: function (key, data) {
      return new Promise((resolve, reject) => {
        // json doesnt support binary
        if (Buffer.isBuffer(key)) key = key.toString('hex')
        if (Buffer.isBuffer(data)) data = data.toString('hex')
        // the '|| null' is because JSON.stringify deletes keys with `undefined` values
        state[key] = data || null
        write(state, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    },
    delete: function (key) {
      return new Promise((resolve, reject) => {
        if (Buffer.isBuffer(key)) key = key.toString('hex')
        delete state[key]
        write(state, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    },
    flush: function () {
      return new Promise((resolve, reject) => {
        state = {}
        db.fs.unlink(db.name, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    },
    flushSync: function () {
      state = {}
      db.fs.unlinkSync(db.name)
    }
  }

  function parse (name) {
    if (typeof name === 'string') return { name: path.resolve(name), fs: fs }
    name.name = path.resolve(name.name)
    if (!name.fs) name.fs = fs
    return name
  }
}
