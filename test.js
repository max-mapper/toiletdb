const fs = require('fs')
const test = require('tape')
const toilet = require('./')
const inmemory = require('./inmemory')

const DB_FILE = './teststate.json'

function reset () {
  try {
    fs.unlinkSync('./teststate.json')
  } catch (e) {}
}

test('write', async function (t) {
  reset()
  const db = toilet(DB_FILE)
  try {
    await db.write('foo', 'bar')
  } catch (e) {
    t.ifErr(e)
  }

  t.equals(fs.readFileSync(DB_FILE).toString(), JSON.stringify({ foo: 'bar' }, null, '  '))
  t.end()
})

test('write + read', async function (t) {
  reset()
  const db = toilet(DB_FILE)
  try {
    await db.write('taco', 'pizza')
    t.equals(fs.readFileSync(DB_FILE).toString(), JSON.stringify({ taco: 'pizza' }, null, '  '))

    const state = await db.read()
    const val = await db.read('taco')
    t.equals(JSON.stringify(state, null, '  '), JSON.stringify({ taco: 'pizza' }, null, '  '))
    t.equals(val, 'pizza')
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('write + read buffer', async function (t) {
  reset()
  const db = toilet(DB_FILE)
  try {
    await db.write(Buffer.from('taco'), Buffer.from('pizza'))
    t.equals(fs.readFileSync(DB_FILE).toString(), JSON.stringify({ '7461636f': '70697a7a61' }, null, '  '))

    const state = await db.read()
    t.equals(JSON.stringify(state, null, '  '), JSON.stringify({ '7461636f': '70697a7a61' }, null, '  '))
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('write + read buffer inmemory', async function (t) {
  const storage = {}
  const db = inmemory(storage)
  try {
    await db.write(Buffer.from('taco'), Buffer.from('pizza'))
    const state = await db.read()
    t.equals(JSON.stringify(state, null, '  '), JSON.stringify({ '7461636f': '70697a7a61' }, null, '  '))
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('write + delete', async function (t) {
  reset()
  const db = toilet(DB_FILE)

  try {
    await db.write('taco', 'pizza')
    await db.write('muffin', 'walrus')
    t.equals(fs.readFileSync(DB_FILE).toString(), JSON.stringify({ taco: 'pizza', muffin: 'walrus' }, null, '  '))

    await db.delete('taco')
    const state = await db.read()
    t.equals(JSON.stringify(state, null, '  '), JSON.stringify({ muffin: 'walrus' }, null, '  '))
  } catch (err) {
    t.ifErr(err)
  }

  t.end()
})

test('write inmemory', async function (t) {
  const storage = {}
  const db = inmemory(storage)
  try {
    await db.write('foo', 'bar')
    t.equals(JSON.stringify(storage), JSON.stringify({ foo: 'bar' }))
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('write + read inmemory', async function (t) {
  reset()
  const storage = {}
  const db = inmemory(storage)

  try {
    await db.write('taco', 'pizza')
    t.equals(JSON.stringify(storage), JSON.stringify({ taco: 'pizza' }))

    const state = await db.read()
    const value = await db.read('taco')

    t.equals(JSON.stringify(state), JSON.stringify({ taco: 'pizza' }))
    t.equals(value, 'pizza')
  } catch (e) {
    t.ifErr(e)
  }

  t.end()
})

test('write + delete inmemory', async function (t) {
  reset()
  const storage = {}
  const db = inmemory(storage)
  try {
    await db.write('taco', 'pizza')
    await db.write('muffin', 'walrus')
    t.equals(JSON.stringify(storage), JSON.stringify({ taco: 'pizza', muffin: 'walrus' }))

    await db.delete('taco')
    const state = await db.read()
    t.equals(JSON.stringify(state), JSON.stringify({ muffin: 'walrus' }))
  } catch (err) {
    t.ifErr(err)
  }
  t.end()
})

test('flush', async function (t) {
  reset()
  const db = toilet(DB_FILE)

  try {
    await db.write('taco', 'pizza')
    await db.flush()

    let state = await db.read()
    t.deepEquals(state, {})

    await db.write('muffin', 'walrus')
    state = await db.read()
    t.deepEquals(state, { muffin: 'walrus' })
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('flushSync', async function (t) {
  reset()
  const db = toilet(DB_FILE)
  try {
    await db.write('taco', 'pizza')
    db.flushSync()
    let state = await db.read()
    t.deepEquals(state, {})

    await db.write('muffin', 'walrus')
    state = await db.read()
    t.deepEquals(state, { muffin: 'walrus' })
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('flush inmemory', async function (t) {
  const db = inmemory()
  try {
    await db.write('taco', 'pizza')
    await db.flush()

    let state = await db.read()
    t.deepEquals(state, {})

    await db.write('muffin', 'walrus')
    state = await db.read()
    t.deepEquals(state, { muffin: 'walrus' })
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('flushSync inmemory', async function (t) {
  const db = inmemory()

  try {
    await db.write('taco', 'pizza')
    db.flushSync()
    let state = await db.read()
    t.deepEquals(state, {})

    await db.write('muffin', 'walrus')
    state = await db.read()
    t.deepEquals(state, { muffin: 'walrus' })
  } catch (e) {
    t.ifErr(e)
  }
  t.end()
})

test('read initial state', async function (t) {
  reset()
  let db = toilet(DB_FILE)

  try {
    await db.open()
    await db.write('foo', 'bar')

    db = toilet(DB_FILE)
    await db.open()
    await db.write('beep', 'boop')
    const state = await db.read()
    t.deepEqual(state, {
      foo: 'bar',
      beep: 'boop'
    })
  } catch (e) {
    t.error(e)
  }

  t.end()
})

test('read initial state inmemory', async function (t) {
  let state = {}
  let db = inmemory(state)

  try {
    await db.open()
    await db.write('foo', 'bar')

    db = inmemory(state)
    await db.open()
    await db.write('beep', 'boop')
    state = await db.read()
    t.deepEqual(state, {
      foo: 'bar',
      beep: 'boop'
    })
  } catch (e) {
    t.error(e)
  }

  t.end()
})
