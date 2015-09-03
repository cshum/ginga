var tape = require('tape')
var ginga = require('../')
var params = ginga.params

function invoke (ctx, done) {
  return done(null, ctx.params)
}
var obj = ginga()
  .define('f1', params('a:string', 'b:string?', 'c:function?'), invoke)
  .define('f2', params('a', 'b:string'), invoke)

function fn () {}

tape('ginga params', function (t) {
  t.plan(6)
  obj.f1('1', '2', function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, { a: '1', b: '2' })
  })
  obj.f1('1', fn, function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, { a: '1', c: fn })
  })
  obj.f2('1', function (err, res) {
    t.ok(err, 'error')
    t.notOk(res, 'no result')
  })
})
