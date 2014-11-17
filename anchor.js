(function (name, context, definition) {
  if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
    module.exports = definition();
  } else if (typeof define === 'function' && typeof define.amd  === 'object') {
    define(function () {
      return definition();
    });
  } else {
    var old = context[name];
    context[name] = definition();
    context[name].noConflict = function(){
      context[name] = old;
      return this;
    };
  }
})('anchor', this, function () {

  var is = {
    'string': function(val){
      return typeof val === 'string';
    },
    'function': function(val){
      return typeof val === 'function';
    },
    'number': function(val){
      return typeof val === 'number';
    },
    'object': function(val){
      return typeof val === 'object' && !!val;
    },
    'array': function(val){
      if(Array.isArray)
        return Array.isArray(val);
      else
        return Object.prototype.call(val) === '[object Array]';
    }
  };

  function emptyFn(ctx, cb){
    if(is.function(cb)) cb();
    return true;
  }

  //Context constructor
  function Context(){
    this._events = {};
  }
  Context.prototype.on = function (type, fn){
    this._events[type] = this._events[type] || [];

    if(is.string(type))
      throw new Error('event type is not defined');
    if(is.function(fn))
      throw new Error('invalid function');

    this._events[type].push(fn);
    return this;
  };
  Context.prototype.emit = function (type, args){
    if(this._events[type]){
      var stack = this._events[type];
      for(var i = 0, l = stack.length; i<l; i++)
        stack[i].apply(this, args);
    }
    return this;
  };

  //Anchor constructor
  function Anchor(scope){
    if(!(this instanceof Anchor))
      return new Anchor(scope);

    scope = scope || {};

    this._scope = scope;
    this._methods = {};
    this._middleware = [];

    var self = this;

    this._scope.use = function(){
      var args = Array.prototype.slice.call(arguments);
      //this refers to scope instance
      //self refers to anchor instance

      var name = null, i, l;

      if(is.array(args[0])){
        //use(['a','b','c'], fn)
        var arr = args.shift();
        for(i = 0, l = arr.length; i<l; i++)
          this.use.apply(this, [arr[i]].concat(args));
        return this;
      }else if(is.object(args[0])){
        //use({ a: fn1, b: fn2, c: fn3 })
        var obj = args.shift();
        for(i in obj)
          this.use.call(this, i, obj[i]);
        return this;
      }

      //single method name
      if(is.string(args[0]))
        name = args.shift();

      //no method name, iterate all methods
      if(!name){
        for(name in self._methods)
          this.use.apply(this, [name].concat(args));
        return this;
      }

      //scope var init
      if(!this._middleware) 
        this._middleware = {};

      if(!this._middleware[name]) 
        this._middleware[name] = [];

      for(i = 0, l = args.length; i<l; i++){
        if(is.function(args[i]))
          this._middleware[name].push(args[i]);
        else
          throw new Error('invalid function');
      }

      return this;
    };
  }

  Anchor.prototype.use = function(){
    var args = Array.prototype.slice.call(arguments);
    var name = null, i, l;

    if(is.array(args[0])){
      //use(['a','b','c'], fn)
      var arr = args.shift();
      for(i = 0, l = arr.length; i<l; i++)
        this.use.apply(this, [arr[i]].concat(args));
      return this;
    }else if(is.object(args[0])){
      //use({ a: fn1, b: fn2, c: fn3 })
      var obj = args.shift();
      for(i in obj)
        this.use.call(this, i, obj[i]);
      return this;
    }

    if(is.string(args[0]))
      name = args.shift();

    for(i = 0, l = args.length; i<l; i++){
      if(is.function(args[i]))
        this._middleware.push({
          name: name,
          fn: args[i]
        });
      else
        throw new Error('invalid function');
    }
    return this;
  };

  Anchor.prototype.define = function(){
    var args = Array.prototype.slice.call(arguments);
    var i, l;

    var name = args[0];
    if(is.array(name)) {
      name = args.shift();
      for(i = 0, l = name.length; i<l; i++)
        this.define.apply(this, [name[i]].concat(args));
      return this;
    }

    if(!is.string(name))
      throw new Error('method name is not defined');

    var invoke = args.pop();
    if (!is.function(invoke))
      invoke = emptyFn;

    this.use.apply(this, args);

    //filter local middleware
    var middleware = [];
    for(i = 0, l = this._middleware.length; i<l; i++){
      var _name = this._middleware[i].name;
      if(!_name || _name === name)
        middleware.push(this._middleware[i].fn);
    }

    //define method
    this._methods[name] = {};

    //pipe with local middleware
    var _pipe = [].concat(
      middleware,
      invoke
    );
    //define scope method
    this._scope[name] = function(){
      var args = Array.prototype.slice.call(arguments);

      //this refers to scope instance, not anchor instance
      var self = this;

      var callback = emptyFn;
      if (is.function(args[args.length - 1]))
        callback = args.pop();

      var pipe = _pipe;
      //pipe scope middleware if exists
      if(this._middleware && this._middleware[name])
        pipe = [].concat(
          middleware,
          this._middleware[name],
          invoke
        );

      //context object and next triggerer
      var ctx = new Context();
      ctx.method = name;
      ctx.scope = this;
      ctx.args = args;

      var index = 0;
      function next(){
        //trigger callback if args exist
        if(arguments.length > 0){
          var args = Array.prototype.slice.call(arguments);
          callback.apply(self, args);
          ctx.emit('end', args);
          return;
        }
        index++;
        if(pipe[index]){
          //trigger next
          pipe[index].call(self, ctx, next);
        }else{
          //trigger empty callback if no more pipe
          callback.apply(self);
          ctx.emit('end');
        }
      }
      pipe[index].call(self, ctx, next);

      return this;
    };
    return this;
  };

  Anchor.prototype.scope = function(){
    return this._scope;
  };

  return Anchor;
});
