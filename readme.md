# toiletdb :toilet:

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

// open the db
await db.open()

// read data from data.json
var data = await db.read()
// read `key` inside data.json
var value = await db.read(key)

// sets `key` to `val` inside data.json
await db.write(key, val)

// deletes `key` key from data.json
await db.delete(key)

// deletes everything from data.json  
await db.flush()

// synchronous version
db.flushSync()
```

### Custom FS

```js

// pass the name and custom fs
var db = toilet({fs: customFs, name: './data.json'})

// write/read as normal
```
