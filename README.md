# Ginga.js

Ginga is a utility module that enables a middleware based (express inspired), modular architecture for creating asynchronous JavaScript methods.

This has been thoroughly used in several of my Node.js projects. While it works, may not be in the best optimised form. Any feedback would be appreciated :).

[![Build Status](https://travis-ci.org/cshum/ginga.svg?branch=master)](https://travis-ci.org/cshum/ginga)

```bash
$ npm install ginga
```

####ginga([object])
Initialise `ginga`

```js
var ginga = require('ginga');
var obj = ginga(); //as a new object

var app = {};
ginga(app); //as a mixin

function App(){ }
ginga(App.prototype); //as a prototype mixin:
```

A Middleware that enables optional parameters and type-checking for your method.

###Method and Hook

`define` and `use` a method with `pre`, `hook`, `invoke` middlewares.
`pre` middlewares initiate and batch operations where `invoke` commits the result. 
In addition several `hook` can be mounted for additional validations or amendments.

####app.define(name, [pre...], invoke)
####app.use(name, [hook...])

```js
var ginga = require('ginga');
var app = ginga();

//defining method
app.define('test', function(ctx, next){
  ctx.logs = ['pre'];
  next();
}, function(ctx, done){
  ctx.logs.push('invoke');
  done(null, ctx.logs);
});

//hook
app.use('test', function(ctx, next){
  ctx.logs.push('hook');
  next();
});

//call method
app.test(function(err, res){
  console.log(res); //['pre', 'hook', 'invoke']
});
```

###Middleware

Upon calling a method, Ginga goes through a sequence of functions `middleware`. A middleware consists of arguments: 
* `ctx` - context object, shared across middlewares
* `next` - callback function, invoke with `next()` or `next(err, result)` 
* `onEnd` - event emitter on callback, invoke with `onEnd(function(err, res){ ... })`

The context object `ctx` maintains state throughout the method call, while encapsulated from `this` object.

A middleware can make changes to context object, or access changes made by previous middlewares.

Current middleware must call `next()` to pass control to the next middleware, or `next(err, result)` to end the sequence and callback with error and result.
Otherwise the method will be left hanging.

####ginga.params([param...])

Ginga built in `params` middleware for parsing method arguments with optional parameters and type-checking, 
`param` is a string in form 

`name[:type][?]`

* `name` - name of the argument mapping into
* `type` (optional) - explicit type of the argument: `string`, `boolean`, `function`, `number`, `date`, `regexp`, `object`, `array`, case insensitive.
* `?` - optional parameter.

```js
var ginga = require('ginga');
var params = ginga.params;

var app = ginga();

//define method with params parsing
app.define('test', params('a:string','b:number?','c:string?'), function(ctx, done){
  done(null, ctx.params); 
});

//call method
app.test('s',1,function(err, res){
  console.log(res); //{"a":"s", "b":1}
});
app.test('s','t',function(err, res){
  console.log(res); //{"a":"s", "c":"t"}
});
app.test(function(err, res){
  console.log(err); //Error: Too few arguments. Expected at least 1
});
```

###Plugin

####app.use(plugin)

```js
var ginga = require('ginga');

//define app
var app = ginga(); 
app.define('test', function(ctx, next){
  ctx.logs = ['pre'];
  next();
}, function(ctx, done){
  ctx.logs.push('invoke');
  done(null, ctx.logs);
});

//define plugin
var plugin = ginga();
plugin.use('test', function(ctx, next){
  ctx.logs.push('plugin');
  next();
});

//use plugin
app.use(plugin);

//call methods
app.test(function(err, res){
  console.log(res); //['pre','plugin', 'invoke']
});
```

###Inheritance
Ginga allows inheritance via prototype chain. 

```js
var ginga = require('ginga');

function App(){}
var A = ginga(App.prototype); //ginga prototype mixin

A.define('test', function(ctx, next){
  ctx.logs = ['pre'];
  next();
}, function(ctx, done){
  ctx.logs.push('invoke');
  done(null, ctx.logs);
});

var a1 = new App();
var a2 = new App();

//prototype hook
A.use('test', function(ctx, next){
  ctx.logs.push('A hook');
  next();
});

//instance hook
a1.use('test', function(ctx, next){
  ctx.logs.push('a1 hook');
  next();
});
a2.use('test', function(ctx, next){
  ctx.logs.push('a2 hook');
  next();
});

//call methods
a1.test(function(err, res){
  console.log(res); //['pre','A hook','a1 hook', 'invoke']
});
a2.test(function(err, res){
  console.log(res); //['pre','A hook','a2 hook', 'invoke']
});

```


## License

MIT
