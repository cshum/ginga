# Ginga

```bash
$ npm install ginga
```

##Example

Middleware

```js
var ginga = require('ginga');

function Clock(){
  this._tick = 'tick';
  this._tock = 'tock';
}
ginga(Clock.prototype)
  .use(function(ctx, next){
    ctx.logs = ['clock',this._tick];
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

//middleware on prototypal instance
clock2.use('tick',function(ctx, next){
  ctx.logs.push('tick2');
  next();
});
clock2.use('tock',function(ctx, next){
  next('booooom'); //error
});

//Results
clock1.tick(console.log.bind(console)); //null [ 'clock', 'tick', 'done' ]
clock1.tock(console.log.bind(console)); //null ['clock','tick','tock','done']
clock2.tick(console.log.bind(console)); //null ['clock','tick','tick2','done']
clock2.tock(console.log.bind(console)); //'booooom'
```
## Changelog


## License

MIT
