'use strict'
const assert = require('assert')
const inspect = obj => require('util').inspect(obj, {colors: true, depth: null})
const tap = require('tap-lite-tester')

const PouchDB = require('pouchdb-core')
PouchDB.plugin(require('pouchdb-adapter-memory'))
PouchDB.plugin(require('../index.js'))

tap.test('smoke', (test) => {
  let db = new PouchDB(test.title)

  assert.equal('function', typeof db.update)
  assert.equal('function', typeof db.updateOrMerge)

  assert.equal('function', typeof db.updateIf)
  assert.equal('function', typeof db.updateIfChanged)
  assert.equal('function', typeof db.updateByVersion)
})

function assert_all(...args) {
  return Promise.all(args).then(() => {}) }

// from https://pouchdb.com/api.html#batch_create example
const exampleBulkDocs = [
  {title : 'Lisa Says', attr: 1942, version: 1, _id: 'doc1'},
  {title : 'Space Oddity', attr: 2042, version: 1, _id: 'doc2'},
  {title : 'Star Trek', attr: 2363, version: 1, _id: 'doc3'},
]

function assert_updateReplace(db, obj) {
  return db.update(obj)
    .then(() => db.get(obj._id))
    .then(actual => {
      obj._rev = actual._rev
      assert.deepEqual(actual, obj)
    }) }

tap.test('update should work', (test) => {
  let db = new PouchDB(test.title)
  return db.bulkDocs(exampleBulkDocs)
    .then(() => assert_all(
      assert_updateReplace(db, {_id:'doc1', test_changed: true, attr:2142}),
      assert_updateReplace(db, {_id:'doc_99', created: true}) ))
})

function assert_updateOrMerge(db, orig, merge) {
  const expected = Object.assign({}, orig, merge)
  return db.updateOrMerge(merge)
    .then(() => db.get(orig._id))
    .then(actual => {
      expected._rev = actual._rev
      assert.deepEqual(actual, expected)
    }) }

tap.test('updateOrMerge should work', (test) => {
  let db = new PouchDB(test.title)
  return db.bulkDocs(exampleBulkDocs)
    .then(() => assert_all(
      assert_updateOrMerge(db, exampleBulkDocs[0], {_id:'doc1', test_changed: true, attr:2142}),
      assert_updateOrMerge(db, exampleBulkDocs[1], {_id:'doc2', test_changed: true}) ))
})


function assert_updateIfChanged(db, changed, orig, obj) {
  if (changed) 
    assert.notDeepEqual(orig, obj)
  else assert.deepEqual(orig, obj)

  return db.updateIfChanged(obj)
    .then(() => db.get(orig._id))
    .then(actual => {
      obj._rev = actual._rev
      orig._rev = actual._rev
      if (changed)
        assert.deepEqual(actual, obj)
      else assert.deepEqual(actual, orig)
    }) }

tap.test('updateIfChanged should work', (test) => {
  let db = new PouchDB(test.title)
  return db.bulkDocs(exampleBulkDocs)
    .then(() => assert_all(
      assert_updateIfChanged(db, false, exampleBulkDocs[0], Object.assign({}, exampleBulkDocs[0])),
      assert_updateIfChanged(db, true, exampleBulkDocs[1], Object.assign({}, exampleBulkDocs[1], {attr: 1842})),
      assert_updateIfChanged(db, true, exampleBulkDocs[2], Object.assign({}, exampleBulkDocs[2], {registry: 'NCC-1701-D'})) ))
})


function assert_updateByVersion(db, orig, other) {
  return db.updateByVersion(other)
    .then(() => db.get(orig._id))
    .then(actual => {
      other._rev = actual._rev
      orig._rev = actual._rev

      if (other.version > orig.version)
        assert.deepEqual(actual, other)
      else assert.deepEqual(actual, orig)
    })
}

tap.test('updateByVersion should work', (test) => {
  let db = new PouchDB(test.title)
  return db.bulkDocs(exampleBulkDocs)
    .then(() => assert_all(
      assert_updateByVersion(db, exampleBulkDocs[0], Object.assign({}, exampleBulkDocs[0])),
      assert_updateByVersion(db, exampleBulkDocs[1], Object.assign({}, exampleBulkDocs[1], {version: 2})),
      assert_updateByVersion(db, exampleBulkDocs[2], Object.assign({}, exampleBulkDocs[2], {version: 1, blek: 'bingo'})) ))
})

