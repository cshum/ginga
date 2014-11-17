var tape = require('tape');
var anchor = require('../anchor');
var params = anchor.params;
var defaults = anchor.defaults;

var obj = anchor()
  .use('f1',
    params('a:string','b:string?','c:function?'), 
    defaults({ b: 'default'})
  )
  .use('f2', params('a','b:string'))
  .define(['f1','f2'], function(ctx, done){
    return done(null, ctx.params);
  })
  .scope();

tape('missing optional',function(t){
  obj.f1('1','2', function(err, res){
    t.notOk(err, 'no error');
    t.deepEqual(res, { a: '1', b: '2' });
    t.end();
  });
});
tape('defaults & skip optional',function(t){
  var fn = function(){};
  obj.f1('1',fn, function(err, res){
    t.notOk(err, 'no error');
    t.deepEqual(res, { a: '1', b: 'default', c: fn });
    t.end();
  });
});
tape('error',function(t){
  obj.f2('1', function(err, res){
    t.ok(err, 'error');
    t.notOk(res, 'no result');
    t.end();
  });
});
