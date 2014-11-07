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

  function Anchor(scope){
    if(!(this instanceof Anchor))
      return new Anchor(scope);

    scope = scope || {};

    this._scope = scope;
    this._middleware = [];

    this._scope.before = function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift('before');
      return hook.apply(this, args);
    };
    this._scope.after = function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift('after');
      return hook.apply(this, args);
    };
  }

  function hook(){
    var args = Array.prototype.slice.call(arguments);

    //before or after
    var at = args.shift();
    if(at !== 'before' && at !== 'after')
      throw new Error('only before or after hook is allowed');

    //method name
    if(typeof args[0] !== 'string')
      throw new Error('method name is not defined');
    var name = args.shift();

    //scope var init
    //this refers to scope instance, not anchor instance
    if(!this._methods) 
      this._methods = {};
    if(!this._methods[name]) 
      this._methods[name] = {
        before:[], after:[]
      };

    for(var i = 0, l = args.length; i<l; i++){
      if(typeof args[i] === 'function')
        this._methods[name][at].push(args[i]);
      else
        throw new Error('invalid function');
    }

    return this;
  }

  Anchor.prototype.hook = function(name, at, target){
    this._scope[name] = function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift(at, target);
      return hook.apply(this, args);
    };
    return this;
  };

  Anchor.prototype.use = function(){
    var args = Array.prototype.slice.call(arguments);
    var name = null;
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

  var emptyFn = function(){};

  Anchor.prototype.define = function(){
    var args = Array.prototype.slice.call(arguments);

    if(typeof args[0] !== 'string')
      throw new Error('method name is not defined');
    var name = args.shift();

    var options = {};
    if(typeof args[0] === 'object')
      options = args.shift();

    if(typeof args[0] !== 'function')
      throw new Error('missing function body');
    var invoke = args[0];

    //filter method middleware
    var middleware = [];
    for(var i = 0, l = this._middleware.length; i<l; i++){
      var _name = this._middleware[i].name;
      if(!_name || _name === name)
        middleware.push(this._middleware[i].fn);
    }

    //default pipe without hooks
    var _pipe = [].concat(
      middleware,
      invoke
    );
    //define scope method
    this._scope[name] = function(){
      var args = Array.prototype.slice.call(arguments);

      //this refers to scope instance, not anchor instance
      var self = this;

      var callback = null;
      if (typeof args[args.length - 1] === 'function')
        callback = args.pop();
      else 
        callback = emptyFn;

      var pipe = _pipe;
      //pipe with hooks if exist
      if(this._methods && this._methods[name])
        pipe = [].concat(
          middleware,
          this._methods[name].before,
          invoke,
          this._methods[name].after
        );

      //context object and next triggerer
      var context = {
        method: name,
        options: options,
        args: args,
        next: next
      };
      var index = 0;
      function next(){
        //trigger callback if args exist
        if(arguments.length > 0)
          callback.apply(self, arguments);

        //block next if error
        if(arguments[0]) return;

        index++;
        if(pipe[index]){
          //trigger next
          pipe[index].call(self, context, next);
        }else{
          //trigger end
        }
      }
      pipe[index].call(self, context, next);

      return this;
    };
    return this;
  };

  Anchor.prototype.scope = function(){
    return this._scope;
  };

  return Anchor;
});
