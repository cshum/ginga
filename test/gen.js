var tape = require('tape')
var ginga = require('../')

tape('Generator function', function (t) {
  var obj = ginga()
    .define('v1', function (ctx) {
      return 522
    })
    .define('v2', function (ctx, done) {
      setTimeout(function () {
        done(null, 167)
      })
    })
    .define('f', function * (ctx, next) {
      var v1 = yield this.v1()
      yield setTimeout(next, 0)
      var v2 = yield this.v2()
      return v1 + v2
    })

  obj.f(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, 689, 'correct value')
    t.end()
  })
})
