var tape = require('tape')
var ginga = require('../')

tape('ginga end', function (t) {
  t.plan(4)
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
})

tape('ginga end emitter', function (t) {
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

tape('ginga end after', function (t) {
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
