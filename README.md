# Ginga.js

Ginga is a utility module that enables a middleware based, modular architecture for creating asynchronous JavaScript methods.

[![Build Status](https://travis-ci.org/cshum/ginga.svg?branch=master)](https://travis-ci.org/cshum/ginga)

```bash
$ npm install ginga
```

####ginga([object])
Initiate `ginga`

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

Middleware can be attached via defining the method `app.define()` or adding a hook `app.use()`.

####app.define(name, [pre, ...], invoke)
####app.use(name, [hook, ...])

```js
var ginga = require('ginga');
var app = ginga();

//defining method
app.define('test', function(ctx, next){
  ctx.logs = ['pre'];
  next();
}, function(ctx, next){
  ctx.logs.push('invoke')
  done(null, ctx.logs);
});

//hook
app.use('test', function(ctx, next){
  ctx.logs.push('hook')
  next();
});

//call method
app.test(function(err, res){
  console.log(res); //['pre', 'hooks', 'invoke']
});
```

###Middleware

Upon calling a Ginga method, it goes through a sequence of functions `middleware`. A middleware consists of arguments: 
* `ctx` - context object, shared across middlewares
* `next` - callback function, invoke with `next()` or `next(err, result)` 
* `onEnd` - event emitter on callback, invoke with `onEnd(function(err, res){ ... })`

The context object `ctx` maintains state throughout the method call, while encapsulated from `this` object.

A middleware can make changes to context object, or access changes made by previous middlewares.

Current middleware must call `next()` to pass control to the next middleware, or `next(err, result)` to end the sequence and callback with an error or result.
Otherwise the method will be left hanging.

####params([defintion, ...])
Middleware for parsing method arguments with optional parameters and type-checking:
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

###Inheritance
Ginga allows inheritance via prototype chain. 

```js
function App(){}
var A = ginga(App.prototype);

A.define('test', function(ctx, next){
  ctx.logs = ['pre'];
  next();
}, function(ctx, done){
  ctx.logs.push('invoke');
  done(null, ctx.logs);
});

var a1 = new App();
var a2 = new App();

A.use('test', function(){
  ctx.logs.push('A hook')
  next();
});

a1.use('test', function(){
  ctx.logs.push('a1 hook')
  next();
});
a2.use('test', function(){
  ctx.logs.push('a2 hook')
  next();
});

```


## License

MIT
