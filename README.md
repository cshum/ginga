# Anchor.js

Anchor.js is a JavaScript utility that provides middleware support for scaffolding asynchronous methods.

## Installation

#### Node.js

```bash
$ npm install anchorjs
```

#### Browser

Include the Anchor.js browser build in your pages.

```html
<script src="anchor.js" type="text/javascript"></script>
```

This will provide `anchor` as a global object, or `define` it if you are using AMD.

##Example
```js
var anchor = require('anchorjs');

function Clock(){
  this._tick = 'tick';
  this._tock = 'tock';
}

//define methods
anchor(Clock.prototype)
  .use(function(ctx, next){
    ctx.stack = ['clock'];
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

//additional middleware for each instance
click2.use('tick',function(ctx, next){
  ctx.stack.push('tick2');
  next();
});
click2.use('tock',function(ctx, next){
  next('booooom'); //error
});


```
#### Changelog

`0.1.2`
- Simplify API
