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

      //method name
      var name = null;
      if(typeof args[0] === 'string')
        name = args.shift();

      //this refers to scope instance

      //scope var init
      if(!this._middleware) 
        this._middleware = {};

      function use(name){
        if(!this._middleware[name]) 
          this._middleware[name] = [];
        for(var i = 0, l = args.length; i<l; i++){
          if(typeof args[i] === 'function')
            this._middleware[name].push(args[i]);
          else
            throw new Error('invalid function');
        }
      }
      if(name){
        use.call(this,name);
      }else{
        //middleware on all methods
        //self refers to anchor instance
        for(name in self._methods)
          use.call(this, name);
      }

      return this;
    };
  }

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

    //filter local middleware
    var middleware = [];
    for(var i = 0, l = this._middleware.length; i<l; i++){
      var _name = this._middleware[i].name;
      if(!_name || _name === name)
        middleware.push(this._middleware[i].fn);
    }

    //define method
    this._methods[name] = options;

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
      var context = {
        method: name,
        options: options,
        args: args,
        next: next
      };
      var index = 0;
      function next(){
        //trigger callback if args exist
        if(arguments.length > 0){
          callback.apply(self, arguments);
          return;
        }
        index++;
        if(pipe[index]){
          //trigger next
          pipe[index].call(self, context, next);
        }else{
          //trigger callback if no more pipe
          callback.apply(self, arguments);
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
