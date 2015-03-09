# Ginga.js

Ginga is a utility module that enables modular, middleware based (express inspired), 'callback hell' suppressing architecture for creating asynchronous JavaScript methods.

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

```js
var ginga = require('ginga');
var app = ginga();

//defining methods
app.define('save', function(ctx, next){

});
```
####app.define(name, [pre, ...], invoke)
####app.use(name, [hook, ...])

###Middleware

Upon calling a Ginga method, it goes through a sequence of functions `middleware`. A middleware consists of arguments: 
* `ctx` - context object, shared across middlewares
* `next` - callback function, invoke with `next()` or `next(err, result)` 
* `onEnd` - event emitter on callback, invoke with `onEnd(function(err, res){ ... })`

The context object `ctx` maintains state throughout the method call, while encapsulated from `this` object.
By default, `ctx` contains the following values: 
* `ctx.method` - method name
* `ctx.args` - method arguments in form of Array. 

A middleware can make changes to context object, or access changes made by previous middlewares.

Current middleware must call `next()` to pass control to the next middleware, or `next(err, result)` to end the sequence and callback with an error or result.
Otherwise the method will be left hanging.

####ginga.params([defintion, ...])
Middleware for parsing method arguments with optional parameters and type-checking:
```js
var ginga = require('ginga');
var params = ginga.params;

var app = ginga();

app.define('test' params('a:string','b:number?','c:string?'), function(ctx, done){
  done(null, ctx.params); 
});

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

###Prototype Chain


## License

MIT
