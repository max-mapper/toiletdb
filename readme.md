# toiletdb

flushes an object to a JSON file. lets you do simple CRUD with async safely with the backend being a flat JSON file

uses [`require('last-one-wins')`](//www.npmjs.com/package/last-one-wins) to ensure atomicity of CRUD actions

note: if you write Buffers they will be converted to hex strings

## API

```js
var toilet = require('toiletdb')
// or require the in-memory version if you want
var db = require('toiletdb/inmemory')

// pass the name of the json file to use
var db = toilet('./data.json')

db.read(function (err, data) {
  // data is from data.json
})

db.write(key, val, function (err) {
  // sets `key` to `val` inside data.json
})

db.delete(key, function (err) {
  // deletes `key` key from data.json
})

db.update(key, val, function (err) {
  // Updates the key with the value using `xtend` for objects
})
```
