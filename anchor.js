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
    'boolean': function(val){
      return typeof val === 'boolean';
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

  //params parsing middleware
  function params(){
    var args = Array.prototype.slice.call(arguments);
    var spec = [];
    var specLen = args.length;
    var min = 0;
    var i, l;
    for(i = 0; i<specLen; i++){
      var obj = {};
      var str = args[i];

      var ch = str.slice(-1);
      obj.required = '?'.indexOf(ch) === -1;

      if(obj.required)
        min++;

      if( '?'.indexOf(ch) > -1)
        str = str.slice(0,-1);

      var arg = str.split(':');
      obj.name = arg[0];
      if(arg.length > 1){
        //defined type
        var check = is[arg[1]];
        if(typeof check !== 'function')
          throw new Error('Parameter `'+arg[0]+'`: type `'+arg[1]+'` not exist');
        obj.check = check;
      }else
        obj.check = emptyFn;
      spec.push(obj);
    }
    return function(ctx, next){
      var i, l;
      var args = ctx.args;
      var len = args.length;
      var params = {};
      var index = 0;
      var offset = 0;
      if(len < min)
        return next(new Error('Too few arguments. Expected at least '+min));
      while(offset < len && index < specLen){
        while(
          !spec[index].check(args[offset]) && 
          !spec[index].required
        ){
          index++;
          if(args[offset] === null || args[offset] === undefined)
            offset++;
          if(index >= specLen || offset >= len)
            return next(new Error('Missing parameters.'));
        }
        if( !spec[index].check(args[offset]) )
          return next(new Error('Invalid type on argument `'+args[offset]+'`.'));

        params[spec[index].name] = args[offset];
        index++;
        offset++;
      }
      ctx.params = params;
      next();
    };
  }

  //defaults middleware
  function defaults(){
    var args = Array.prototype.slice.call(arguments);
    return function(ctx, next){
      ctx.params = ctx.params || {};
      for(var i = 0, l = args.length; i < l; i++){
        var source = args[i];
        for(var prop in source){
          if(ctx.params[prop] === void 0)
            ctx.params[prop] = source[prop];
        }
      }
      next();
    };
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
    this._middleware = [];

    this._scope.use = this._scope.use || function(){
      var args = Array.prototype.slice.call(arguments);
      //this refers to scope instance

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

      if(!name)
        throw new Error('Need to specify method name for instance middleware.');

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
          //trigger pipe
          var fn = pipe[index];
          var len = fn.length;
          if(len === 2) 
            fn.call(self, ctx, next);
          else if(len === 1) 
            fn.call(self, next);
          else if(len === 0){
            fn.call(self);
            next(); //no need callback
          }
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
  Anchor.params = params;
  Anchor.defaults = defaults;

  return Anchor;
});
