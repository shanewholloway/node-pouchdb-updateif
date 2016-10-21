'use strict'
let _deepEqual
try { _deepEqual = require('deep-equal') }
catch(err) {
  const assert = require('assert')
  _deepEqual = (a,b) => {
    try { return assert.deepEqual(a,b), true }
    catch (err) { return false } }
}

Object.assign(exports, {
  updateWith(obj, applyFn) {
    if ('string' === typeof obj)
      obj = {_id: obj}
    if ('function' !== typeof applyFn)
      throw new Error("Parameter `applyFn` is required and must be a function")

    return this.get(obj._id)
      .then(
        current => {
          const {_id, _rev} = current ? current : {}
          if (!obj._rev) obj._rev = _rev

          let ans = applyFn(obj, current, _rev)
          
          if (!ans) return ans

          if (!ans._id) ans._id = _id
          if (!ans._rev && _id===ans._id) ans._rev = _rev
          return ans },
        err => {
          if (err.status !== 404) throw err;
          let ans = applyFn ? applyFn(obj, null, null) : obj
          return ans })
      .then(ans => ans ? this.put(ans) : null)
  },

  updateIf(obj, filterFn) {
    return this.updateWith(obj, (obj, current) =>
      filterFn(obj, current) ? obj : null) },

  overwrite(obj) {
    return this.updateWith(obj, obj => obj) },
  replace(obj) { return this.overwrite(obj) },

  updateAssign(obj) {
    return this.updateWith(obj, (obj, current) =>
      current ? Object.assign(current, obj) : obj) },
  updateOrMerge(obj) { return this.updateAssign(obj) },

  _checkNewVersion(obj, current) {
    return !current || obj.version > current.version },
  updateByVersion(obj, checkNewVersion) {
    if (!checkNewVersion) checkNewVersion = this._checkNewVersion
    return this.updateIf(obj, checkNewVersion) },

  _checkChanged(obj, current) {
    return !current || !_deepEqual(obj, current) },
  updateIfChanged(obj, checkChanged) {
    if (!checkChanged) checkChanged = this._checkChanged
    return this.updateIf(obj, checkChanged) },
})

