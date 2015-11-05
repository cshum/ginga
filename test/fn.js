var tape = require('tape')
var ginga = require('../')

tape('end callback and promise', function (t) {
  t.plan(10)
  var obj = ginga().define('f', function (ctx, done, end) {
    end(function (err, res) {
      t.deepEqual(err, 'err')
      t.deepEqual(res, 'res')
    })
    done('err', 'res')
  })

  obj.f(function (err, res) {
    t.deepEqual(err, 'err')
    t.deepEqual(res, 'res')
  })

  t.equal(typeof obj.f().then, 'function', 'no cb returns promise')

  obj.f().then(function (res) {
    t.error(res, 'not resolved if error')
  }).catch(function (err) {
    t.deepEqual(err, 'err')
  })
})

tape('end emitter', function (t) {
  t.plan(4)
  var obj = ginga().define('f', function (ctx, done) {
    ctx.on('end', function (err, res) {
      t.deepEqual(err, 'err')
      t.deepEqual(res, 'res')
    })
    done('err', 'res')
  })

  obj.f(function (err, res) {
    t.deepEqual(err, 'err')
    t.deepEqual(res, 'res')
  })
})

tape('end after', function (t) {
  t.plan(4)
  var obj = ginga().define('f', function (ctx, done, end) {
    setTimeout(function () {
      end(function (err, res) {
        t.deepEqual(err, 'err')
        t.deepEqual(res, 'res')
      })
    }, 10)
    done('err', 'res')
  })

  obj.f(function (err, res) {
    t.deepEqual(err, 'err')
    t.deepEqual(res, 'res')
  })
})
