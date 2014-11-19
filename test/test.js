var tape = require('tape');
var anchor = require('../anchor');

function Clock(){
  this._tick = 'tick';
  this._tock = 'tock';
}
anchor(Clock.prototype)
  .use(function(ctx, next){
    ctx.logs = ['clock'];
    next();
  })
  .use(function(ctx, next){
    ctx.logs.push(this._tick);
    next();
  })
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
  'tick': function(ctx, next){
    ctx.logs.push('more tick');
    next();
  },
  'tock': function(next){
    next('booooom');
  }
});

tape('anchor middleware', function (t) {
  clock1.tick(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','done']);
    t.end();
  });
});
tape('anchor middleware 2', function (t) {
  clock1.tock(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','tock','done']);
    t.end();
  });
});
tape('instance middleware',function(t){
  clock2.tick(function(err,res){
    t.notOk(err, 'no error');
    t.deepEqual(res,['clock','tick','more tick','done']);
    t.end();
  });
});
tape('instance middleware 2',function(t){
  clock2.tock(function(err,res){
    t.notOk(res, 'no result');
    t.equal(err,'booooom', 'return error');
    t.end();
  });
});
