# Anchor.js

Anchor.js is a JavaScript utility that provides middleware and hook support for scaffolding asynchronous methods.

##Example
```
var anchor = require('anchorjs');

function Clock(){
  this._tick = 'tick';
  this._tock = 'tock';
}

//define methods
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

function callback(ctx, done){
  ctx.stack.push('done');
  done(null, ctx.stack);
}

var clock1 = new Clock();
var click2 = new Clock();

//additional hook on instance
click2.before('tick',function(ctx, next){
  ctx.stack.push('tick2');
  next();
});
click2.before('tock',function(ctx, next){
  next('booooom'); //error
});


```

## Installation

###Node.js

```
$ npm install anchorjs
```

### Browser

Include the Anchor.js browser build in your pages.

```html
<script src="anchor.js" type="text/javascript"></script>
```

This will provide `anchor` as a global object, or `define` it if you are using AMD.
