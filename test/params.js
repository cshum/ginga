var tape = require('tape');
var anchor = require('../anchor');
var params = anchor.params;

var obj = anchor()
  .use({
    f1: params('a:string','b:string?','c:function?'),
    f2: params('a','b:string')
  })
  .define(['f1','f2'], function(ctx, done){
    return done(null, ctx.params);
  })
  .scope();

obj.f1('1','2',console.log.bind(console));
obj.f1('1', function(){},console.log.bind(console));
obj.f2('1',console.log.bind(console));
