var is      = require('./is'),
    flatten = require('./flatten'),
    EventEmitter = require('events').EventEmitter,
    params  = require('./params');

//ginga use method
function use(){
  //init hooks
  if(!this.hasOwnProperty('_hooks')){
    this._hooks = {};
  }

  var args = Array.prototype.slice.call(arguments);
  var name = null, i, j, l, m;

  if(is.array(args[0])){
    //use(['a','b','c'], ...)
    var arr = args.shift();
    for(i = 0, l = arr.length; i<l; i++)
      use.apply(this, [arr[i]].concat(args));
    return this;
  }else if(is.object(args[0]) && args[0]._hooks){
    //use(ginga)
    var key;
    //concat hooks
    for(key in args[0]._hooks)
      use.call(this, key, args[0]._hooks[key]);
    return this;
  }

  //method name
  if(is.string(args[0]))
    name = args.shift();
  if(!name)
    throw new Error('Method name is not defined.');
  if(!this._hooks[name])
    this._hooks[name] = [];

  for(i = 0, l = args.length; i<l; i++){
    if(is.function(args[i])){
      this._hooks[name].push(args[i]);
    }else if(is.array(args[i])){
      //use('a', [fn1, fn2, fn3])
      for(j = 0, m = args[i].length; j<m; j++)
        use.call(this, name, args[i][j]);
      return this;
    }else
      throw new Error('Middleware must be a function');
  }

  return this;
}

//ginga define method
function define(){
  var args = Array.prototype.slice.call(arguments);
  var i, l;

  var name = args.shift();
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
    invoke = null;

  var pre = args;

  //define scope method
  this[name] = function(){
    var args = Array.prototype.slice.call(arguments);
    var self = this;

    var callbacks = [];
    if (is.function(args[args.length - 1]))
      callbacks.push(args.pop());

    //init pipeline;
    var pipe = [];
    var obj = this;

    //prototype chain
    while(obj){
      if(obj.hasOwnProperty('_hooks') && obj._hooks[name])
        pipe.unshift(obj._hooks[name]);
      obj = Object.getPrototypeOf(obj);
    }
    //pre middlewares
    pipe.unshift(pre);

    //invoke middleware
    if(invoke)
      pipe.push(invoke);

    pipe = flatten(pipe);

    //context object and next triggerer
    var ctx = new EventEmitter();
    ctx.method = name;
    ctx.args = args;

    var index = 0;
    var size = pipe.length;
    var cb = null;

    function end(fn){
      if(cb)
        fn.apply(self, cb);
      else if(is.function(fn))
        callbacks.push(fn);
    }
    function next(){
      if(arguments.length > 0){
        for(var i = 0, l = callbacks.length; i<l; i++)
          callbacks[i].apply(self, arguments);
        cb = Array.prototype.slice.call(arguments);
        ctx.emit.apply(ctx, ['end'].concat(cb));
        return;
      }
      if(index < size){
        var fn = pipe[index];
        var len = fn.length;
        index++;

        fn.call(self, ctx, next, end);
        //args without next()
        if(fn.length < 2) next();
      }else{
        //trigger empty callback if no more pipe
        next(null);
      }
    }
    next();

    return this;
  };
  return this;
}

function Ginga(scope){
  scope = scope || {};
  scope.use = use;
  scope.define = define;

  return scope;
}
Ginga.use = use;
Ginga.define = define;
Ginga.params = params;

module.exports = Ginga;
