# Ginga

Ginga is a JavaScript library that enable modular control flow of asynchronous Javascript methods.

```bash
$ npm install ginga
```
###ginga()
###app.define()
###app.use()
###ginga.params()
A Middleware that enables optional parameters and type-checking for your method.

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

###Method and Hook

Middleware can be attached via defining the method `app.define()` or adding a hook `app.use()`.

    var app = ginga();

    //defining methods
    app.define('save', function(ctx, next){

    });

###Plugin

###Prototype


## License

MIT
