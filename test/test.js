var tape = require('tape');
var anchor = require('../anchor');

function Clock(){
  this._tick = 'tick';
  this._tock = 'tock';
}
anchor(Clock.prototype)
  .use([
    function(ctx, next){
      ctx.logs = ['clock'];
      next();
    }, 
    function(ctx, next){
      ctx.logs.push(this._tick);
      next();
    }
  ])
  .use('tock',function(ctx, next){
    ctx.logs.push(this._tock);
    next();
  })
  .define(['tick','tock'],function(ctx, done){
    ctx.logs.push('done');
    done(null, ctx.logs);
 });

var clock1 = new Clock();
var clock2 = new Clock();

clock2.use({
  'tick': [
    function(ctx, next){
      ctx.logs.push('more');
      next();
    },
    function(ctx, next){
      ctx.logs.push('and more tick');
      next();
    }
  ],
  'tock': function(next){
    next('booooom');
  }
});

tape('anchor middleware', function (t) {
  t.plan(8);

  clock1.tick(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','done']);
  });
  clock1.tock(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','tock','done']);
  });
  clock2.tick(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','more','and more tick','done']);
  });
  clock2.tock(function(err,res){
    t.notOk(res, 'no result');
    t.equal(err,'booooom', 'return error');
  });
});
