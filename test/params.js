var tape = require('tape')
var ginga = require('../')
var params = ginga.params

function invoke (ctx) {
  return ctx.params
}
var obj = ginga()
  .define('f1', params('a:string', 'b:string?', 'c:number?'), invoke)
  .define('f2', params('a', 'b:string'), invoke)

tape('ginga params', function (t) {
  t.plan(9)
  obj.f1('1', '2', function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, { a: '1', b: '2' }, 'callback result')
  })
  obj.f1('1', 167, function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, { a: '1', c: 167 }, 'callback result')
  })
  obj.f2('1', function (err, res) {
    t.equal(err.message, 'Too few arguments. Expected at least 2')
    t.notOk(res, 'no result')
  })

  obj.f1('1', '2')
  .then(function (res) {
    t.deepEqual(res, { a: '1', b: '2' }, 'promise resolve')
  }).catch(t.error)

  obj.f1('1', 167)
  .then(function (res) {
    t.deepEqual(res, { a: '1', c: 167 }, 'promise resolve')
  }).catch(t.error)

  obj.f2('1')
  .then(t.error)
  .catch(function (err) {
    t.equal(err.message, 'Too few arguments. Expected at least 2')
  })
})
