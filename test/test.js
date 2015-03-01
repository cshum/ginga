var tape = require('tape');
var ginga = require('../');

function Clock(){
  this._tick = 'tick';
  this._tock = 'tock';
}

function base(ctx, next){
  ctx.logs = ['clock'];
  next();
}
function tick(ctx, next){
  ctx.logs.push(this._tick);
  next();
}
function tock(ctx, next){
  ctx.logs.push(this._tock);
  next();
}
function end(ctx, done){
  ctx.logs.push('done');
  done(null, ctx.logs);
}
ginga(Clock.prototype)
  .define('tick', base, tick, end)
  .define('tock', base, tick, tock, end);

var clock1 = new Clock();
var clock2 = new Clock();

clock2.use(
  'tick',
  function(ctx, next){
    ctx.logs.push('more');
    next();
  },
  function(ctx, next){
    ctx.logs.push('and more tick');
    next();
  }
);
clock2.use(
  'tock',
  function(ctx, next){
    next('booooom');
  }
);

tape('ginga middleware', function (t) {
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
