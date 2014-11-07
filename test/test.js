var tape = require('tape');
var anchor = require('../anchor');

function callback(ctx, done){
  ctx.stack.push('done');
  done(null, ctx.stack);
}

function Clock(){
  this._tick = 'tick';
  this._tock = 'tock';
}
anchor(Clock.prototype)
  .use(function(ctx, next){
    ctx.stack = ['clock'];
    next();
  })
  .use(function(ctx, next){
    ctx.stack.push(this._tick);
    next();
  })
  .use('tock',function(ctx, next){
    ctx.stack.push(this._tock);
    next();
  })
  .define('tick',callback)
  .define('tock',callback);

var clock1 = new Clock();
var click2 = new Clock();

click2.before('tick',function(ctx, next){
  ctx.stack.push('tick2');
  next();
});
click2.before('tock',function(ctx, next){
  next('booooom');
});

tape('middleware 1', function (t) {
  clock1.tick(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','done']);
    t.end();
  });
});
tape('middleware 2', function (t) {
  clock1.tock(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','tock','done']);
    t.end();
  });
});
tape('before hook',function(t){
  click2.tick(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','tick2','done']);
    t.end();
  });
});
tape('before hook error',function(t){
  click2.tock(function(err,res){
    t.notOk(res, 'no result');
    t.equal(err,'booooom', 'return error');
    t.end();
  });
});
