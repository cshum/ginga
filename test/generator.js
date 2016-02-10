var tape = require('tape')
var ginga = require('../')

tape('Generator function', function (t) {
  var obj = ginga()
    .define('v', function * (ctx, next) {
      yield setTimeout(next, 0)
      return 522
    })
    .define('v1', function * () {
      return yield this.v()
    })
    .define('v2', function (ctx, done) {
      setTimeout(function () {
        done(null, 167)
      })
    })
    .define('f', function * (ctx, next) {
      return (yield this.v1()) + (yield this.v2(next))
    })

  obj.f(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, 689, 'correct value')
    t.end()
  })
})
