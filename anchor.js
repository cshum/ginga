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

  var emptyFn = function(){};
  var dummyFn = function(ctx, done){ done(null,null); }

  function Context(){
    this._events = {};
  }
  Context.prototype.on = function (type, fn){
    this._events[type] = this._events[type] || [];

    if(typeof type !== 'string')
      throw new Error('event type is not defined');
    if(typeof fn !== 'function')
      throw new Error('invalid function');

    this._events[type].push(fn);
    return this;
  }
  Context.prototype.emit = function (type, args){
    if(this._events[type]){
      var stack = this._events[type];
      for(var i = 0, l = stack.length; i<l; i++)
        stack[i].apply(this, args);
    }
    return this;
  }

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

      var name = null;

      //method name array
      if(Array.isArray(args[0])){
        name = args.shift();
        for(var i = 0, l = name.length; i<l; i++)
          this.use.apply(this, [name[i]].concat(args));
        return this;
      }

      //single method name
      if(typeof args[0] === 'string')
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

      for(var i = 0, l = args.length; i<l; i++){
        if(typeof args[i] === 'function')
          this._middleware[name].push(args[i]);
        else
          throw new Error('invalid function');
      }

      return this;
    };
  }

  Anchor.prototype.use = function(){
    var args = Array.prototype.slice.call(arguments);
    var name = null;

    if(Array.isArray(args[0])) {
      name = args.shift();
      for(var i = 0, l = name.length; i<l; i++)
        this.use.apply(this, [name[i]].concat(args));
      return this;
    }

    if(typeof args[0] === 'string')
      name = args.shift();

    for(var i = 0, l = args.length; i<l; i++){
      if(typeof args[i] === 'function')
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

    var name = args[0];
    if(Array.isArray(name)) {
      name = args.shift();
      for(var i = 0, l = name.length; i<l; i++)
        this.define.apply(this, [name[i]].concat(args));
      return this;
    }

    if(typeof name !== 'string')
      throw new Error('method name is not defined');

    if (typeof args[args.length - 1] !== 'function')
      throw new Error('invoke function is not defined');
    var invoke = args.pop();

    this.use.apply(this, args);

    //filter local middleware
    var middleware = [];
    for(var i = 0, l = this._middleware.length; i<l; i++){
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
      if (typeof args[args.length - 1] === 'function')
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
          ctx.emit('next');
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
