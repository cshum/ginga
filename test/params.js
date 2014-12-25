var tape = require('tape');
var anchor = require('../anchor');
var params = anchor.params;

var obj = anchor()
  .use('f1', params('a:string','b:string?','c:function?') )
  .use('f2', params('a','b:string'))
  .define(['f1','f2'], function(ctx, done){
    return done(null, ctx.params);
  })
  .scope;

function fn(){}

tape('anchor params',function(t){
  t.plan(6);
  obj.f1('1','2', function(err, res){
    t.notOk(err, 'no error');
    t.deepEqual(res, { a: '1', b: '2' });
  });
  obj.f1('1',fn, function(err, res){
    t.notOk(err, 'no error');
    t.deepEqual(res, { a: '1', c: fn });
  });
  obj.f2('1', function(err, res){
    t.ok(err, 'error');
    t.notOk(res, 'no result');
  });
});
