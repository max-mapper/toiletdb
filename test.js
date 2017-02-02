var fs = require('fs')
var test = require('tape')
var toilet = require('./')
var inmemory = require('./inmemory')

var data = './teststate.json'

function reset () {
  try {
    fs.unlinkSync('./teststate.json')
  } catch (e) {}
}

test('write', function (t) {
  reset()
  var db = toilet(data)
  db.write('foo', 'bar', function (err) {
    t.ifErr(err)
    t.equals(fs.readFileSync(data).toString(), JSON.stringify({foo: 'bar'}))
    t.end()
  })
})

test('write + read', function (t) {
  reset()
  var db = toilet(data)
  db.write('taco', 'pizza', function (err) {
    t.ifErr(err)
    t.equals(fs.readFileSync(data).toString(), JSON.stringify({taco: 'pizza'}))
    db.read(function (err, state) {
      t.ifErr(err)
      t.equals(JSON.stringify(state), JSON.stringify({taco: 'pizza'}))
      t.end()
    })
  })
})

test('write + read buffer', function (t) {
  reset()
  var db = toilet(data)
  db.write(new Buffer('taco'), new Buffer('pizza'), function (err) {
    t.ifErr(err)
    t.equals(fs.readFileSync(data).toString(), JSON.stringify({"7461636f":"70697a7a61"}))
    db.read(function (err, state) {
      t.ifErr(err)
      t.equals(JSON.stringify(state), JSON.stringify({"7461636f":"70697a7a61"}))
      t.end()
    })
  })
})

test('write + delete', function (t) {
  reset()
  var db = toilet(data)
  db.write('taco', 'pizza', function (err) {
    t.ifErr(err)
    db.write('muffin', 'walrus', function (err) {
      t.ifErr(err)
      t.equals(fs.readFileSync(data).toString(), JSON.stringify({taco: 'pizza', muffin: 'walrus'}))
      db.delete('taco', function (err) {
        t.ifErr(err)
        db.read(function (err, state) {
          t.ifErr(err)
          t.equals(JSON.stringify(state), JSON.stringify({muffin: 'walrus'}))
          t.end()
        })
      })
    })
  })
})

test('write inmemory', function (t) {
  reset()
  var storage = {}
  var db = inmemory(storage)
  db.write('foo', 'bar', function (err) {
    t.ifErr(err)
    t.equals(JSON.stringify(storage), JSON.stringify({foo: 'bar'}))
    t.end()
  })
})

test('write + read inmemory', function (t) {
  reset()
  var storage = {}
  var db = inmemory(storage)
  db.write('taco', 'pizza', function (err) {
    t.ifErr(err)
    t.equals(JSON.stringify(storage), JSON.stringify({taco: 'pizza'}))
    db.read(function (err, state) {
      t.ifErr(err)
      t.equals(JSON.stringify(state), JSON.stringify({taco: 'pizza'}))
      t.end()
    })
  })
})

test('write + delete inmemory', function (t) {
  reset()
  var storage = {}
  var db = inmemory(storage)
  db.write('taco', 'pizza', function (err) {
    t.ifErr(err)
    db.write('muffin', 'walrus', function (err) {
      t.ifErr(err)
      t.equals(JSON.stringify(storage), JSON.stringify({taco: 'pizza', muffin: 'walrus'}))
      db.delete('taco', function (err) {
        t.ifErr(err)
        db.read(function (err, state) {
          t.ifErr(err)
          t.equals(JSON.stringify(state), JSON.stringify({muffin: 'walrus'}))
          t.end()
        })
      })
    })
  })
})
