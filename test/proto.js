var tape = require('tape')
var ginga = require('../')
var Promise = require('pinkie-promise')

tape('ginga prototype', function (t) {
  t.plan(10)

  function Clock () {
    this._tick = 'tick'
    this._tock = 'tock'
  }
  function base (ctx, next) {
    ctx.logs = ['clock']
    // async callback
    setTimeout(next, 10)
  }
  function tick (ctx, next) {
    ctx.logs.push(this._tick)
    // resolver function
    next(function (result) {
      t.equal(result, 167199, 'callback resolver')
    })(null, 167199)
  }
  function tock (ctx) {
    // no next arg
    ctx.logs.push(this._tock)
  }
  function end (ctx) {
    ctx.logs.push('done')
    // then result
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(ctx.logs)
      }, 10)
    })
  }
  var C = ginga(Clock.prototype)

  var clock1 = new Clock()
  var clock2 = new Clock()

  clock2.use('tick', function (ctx) {
    // return thenable
    return new Promise(function (resolve) {
      setTimeout(function () {
        ctx.logs.push('more')
        resolve() // no value, should do next
      }, 10)
    })
  }, function (ctx) {
    ctx.logs.push('and more tick')
  })
  clock2.use('tock', function (ctx, next) {
    // resolver callback err
    next(t.error)('booooom')
  })

  C.define('tick', end)
  C.define('tock', end)
  C.use('tick', base, tick)
  C.use('tock', base, tick, tock)

  clock1.tick(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, ['clock', 'tick', 'done'])
  })
  clock1.tock().then(function (res) {
    t.deepEqual(res, ['clock', 'tick', 'tock', 'done'])
  }).catch(t.error)

  clock2.tick(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, ['clock', 'tick', 'more', 'and more tick', 'done'])
  })
  clock2.tock().then(t.error).catch(function (err) {
    t.equal(err, 'booooom', 'return error')
  })
})
