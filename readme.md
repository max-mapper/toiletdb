# toiletdb

flushes an object to a JSON file. lets you do simple CRUD with async safely with the backend being a flat JSON file

## example

```js
var toilet = require('toiletdb')
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
```
