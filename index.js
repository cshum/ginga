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
})('ginga', this, function() {

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

  function emptyMw(cb){
    if(is.function(cb)) 
      cb(null, null);
    return true;
  }
  function newObj(){
    return {};
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
        obj.check = emptyMw;
      spec.push(obj);
    }
    return function(ctx, next){
      var i, l;
      var args = ctx.args;
      var len = args.length;
      var params = {};
      var index = 0;
      var offset = 0;

      ctx.params = params;
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
            return next();
        }
        if( !spec[index].check(args[offset]) )
          return next(new Error('Invalid type on argument `'+args[offset]+'`.'));

        params[spec[index].name] = args[offset];
        index++;
        offset++;
      }
      next();
    };
  }

  function use(){
    var args = Array.prototype.slice.call(arguments);

    var name = null, i, j, l, m;

    if(is.array(args[0])){
      //use(['a','b','c'], ...)
      var arr = args.shift();
      for(i = 0, l = arr.length; i<l; i++)
        use.apply(this, [arr[i]].concat(args));
      return this;
    }else if(is.object(args[0])){
      //use({ a: fn1, b: fn2, c: fn3 })
      var obj = args.shift();
      for(i in obj)
        use.call(this, i, obj[i]);
      return this;
    }

    //single method name
    if(is.string(args[0]))
      name = args.shift();

    //init hooks
    if(this._hooks){
      //prototype instance
      if(!this.hasOwnProperty('_hooks'))
        this._hooks = [this._hooks];
    }else
      this._hooks = [];

    for(i = 0, l = args.length; i<l; i++){
      if(is.function(args[i])){
        this._hooks.push(args[i]);
      }else if(is.array(args[i])){
        //use('a', [fn1, fn2, fn3])
        for(j = 0, m = args[i].length; j<m; j++)
          use.call(this, name, args[i][j]);
        return this;
      }else
        throw new Error('invalid function');
    }

    return this;
  }

  function define(){
    var args = Array.prototype.slice.call(arguments);
    var i, l;

    var name = args[0];
    if(is.array(name)) {
      name = args.shift();
      for(i = 0, l = name.length; i<l; i++)
        define.apply(this, [name[i]].concat(args));
      return this;
    }

    if(!is.string(name))
      throw new Error('method name is not defined');

    var invoke = args.pop();
    if (!is.function(invoke))
      invoke = emptyMw;

    use.apply(this, args);

    //filter local middleware
    var middleware = [];
    for(i = 0, l = this._hooks.length; i<l; i++){
      var _name = this._hooks[i].name;
      if(!_name || _name === name)
        middleware.push(this._hooks[i].fn);
    }

    //pipe with local middleware
    var _pipe = [].concat(
      middleware,
      invoke
    );
    //define scope method
    this[name] = function(){
      var args = Array.prototype.slice.call(arguments);

      //this refers to scope instance, not driver instance
      var self = this;

      var callback = emptyMw;
      if (is.function(args[args.length - 1]))
        callback = args.pop();

      var pipe = _pipe;
      //pipe scope middleware if exists
      if(this._hooks && this._hooks[name])
        pipe = [].concat(
          middleware,
          this._hooks[name],
          invoke
        );

      //context object and next triggerer
      var ctx = {
        method: name,
        args: args
      };
      var callbacks = [callback];
      var index = 0;

      function trigger(){
        var fn = pipe[index];
        var len = fn.length;
        if(len >= 2) 
          fn.call(self, ctx, next, onEnd);
        else if(len === 1) 
          fn.call(self, next);
        else if(len === 0){
          throw new Error('Missing callback function.');
        }
      }
      function onEnd(fn){
        if(!fn) return;
        if(!is.function(fn))
          throw new Error('end callback must be function');
        callbacks.push(fn);
      }
      function next(){
        //trigger callback if args exist
        if(arguments.length > 0){
          var args = Array.prototype.slice.call(arguments);
          for(i = 0, l = callbacks.length; i<l; i++){
            callbacks[i].apply(self, args);
          }
          return;
        }
        index++;
        if(pipe[index]){
          //trigger pipe
          trigger();
        }else{
          //trigger empty callback if no more pipe
          for(i = 0, l = callbacks.length; i<l; i++){
            callbacks[i].apply(self);
          }
        }
      }
      trigger();

      return this;
    };
    return this;
  }

  function Ginga(scope, context){
    scope = scope || {};

    scope._hooks = [];
    scope._context = is.function(context) ? context : newObj;
    scope.use = use;
    scope.define = define;

    return scope;
  }
  Ginga.params = params;

  return Ginga;
});
