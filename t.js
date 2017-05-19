var toilet = require('.')
var test = require('tape')
var fs = require('fs')

test(function (t) {
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
