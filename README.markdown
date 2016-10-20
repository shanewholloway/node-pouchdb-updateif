# pouchdb-updateif

Utilities for conditional updating of Pouch/Couch objects


### Installation

```bash
$ npm install pouchdb-updateif
```

### Example

```javascript
const asDesignDoc = require('couch-asdesigndoc')
const PouchDB = require('pouchdb-node')
PouchDB.plugin(require('pouchdb-updateif')

let db = new PouchDB('example')
db.updateIfChanged(asDesignDoc({
  _id: '_design/test',
  views: {
    simple: {
      map(doc) { emit(doc.date, doc.title) }
    }
  }
})
```

