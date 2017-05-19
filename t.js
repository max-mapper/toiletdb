var toilet = require('.')
var test = require('tape')
var fs = require('fs')

test('fails', function (t) {
  t.plan(4)
  var file = '/tmp/t' 
  try { fs.unlinkSync(file) } catch (_) {}
  var db = toilet(file)
  db.write('foo', 'bar', function (err) {
    t.error(err)
    // read: restart the process
    db = toilet(file)
    db.write('beep', 'boop', function (err) {
      t.error(err)
      db.read(function (err, state) {
        t.error(err)
        t.deepEqual(state, {
          foo: 'bar',
          beep: 'boop'
        })
      })
    })
  })
})

test('passes', function (t) {
  t.plan(6)
  var file = '/tmp/t' 
  try { fs.unlinkSync(file) } catch (_) {}
  var db = toilet(file)
  db.init(function (err) {
    t.error(err)
    db.write('foo', 'bar', function (err) {
      t.error(err)
      // read: restart the process
      db = toilet(file)
      db.init(function (err) {
        t.error(err)
        db.write('beep', 'boop', function (err) {
          t.error(err)
          db.read(function (err, state) {
            t.error(err)
            t.deepEqual(state, {
              foo: 'bar',
              beep: 'boop'
            })
            t.end()
          })
        })
      })
    })
  })
})
