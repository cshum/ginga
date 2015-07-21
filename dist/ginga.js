(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ginga = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var is = _dereq_('./is');

module.exports = function flatten(arr, res){
  if(!res){
    res = [];
  }
  for(var i = 0, l = arr.length; i < l; i++){
    if(arr[i] && is.array(arr[i])){
      flatten(arr[i], res);
    }else{
      res.push(arr[i]);
    }
  }
  return res;
};

},{"./is":2}],2:[function(_dereq_,module,exports){
var is = module.exports;

is.string = function(val){
  return typeof val === 'string';
};
is.boolean = function(val){
  return typeof val === 'boolean';
};
is.function = function(val){
  return typeof val === 'function';
};
is.number = function(val){
  return typeof val === 'number';
};
is.date = function(val){
  return Object.prototype.toString.call(val) === '[object Date]';
};
is.regexp = function(val){
  return Object.prototype.toString.call(val) === '[object RegExp]';
};
is.object = function(val){
  return typeof val === 'object' && !!val;
};
is.array = Array.isArray || function(val){
  return Object.prototype.toString.call(val) === '[object Array]';
};

},{}],3:[function(_dereq_,module,exports){
var is = _dereq_('./is');

function dummy(){
  return true;
}

//params parsing middleware
module.exports = function(){
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
      var check = is[arg[1].toLowerCase()];
      if(typeof check !== 'function')
        throw new Error('Parameter `'+arg[0]+'`: type `'+arg[1]+'` not exist');
      obj.check = check;
    }else
      obj.check = dummy;
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
};

},{"./is":2}],4:[function(_dereq_,module,exports){
var is      = _dereq_('./is'),
    flatten = _dereq_('./flatten'),
    params  = _dereq_('./params');

var prototypeOf = Object.getPrototypeOf || function(obj){
  return obj.__proto__; 
};

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
      obj = prototypeOf(obj);
    }
    //pre middlewares
    pipe.unshift(pre);

    //invoke middleware
    if(invoke)
      pipe.push(invoke);

    pipe = flatten(pipe);

    //context object and next triggerer
    var ctx = {
      method: name,
      args: args
    };
    var index = 0;
    var size = pipe.length;
    var cbArgs = null;

    function end(fn){
      if(cbArgs)
        fn.apply(self, cbArgs);
      else if(is.function(fn))
        callbacks.push(fn);
    }
    function next(){
      if(arguments.length > 0){
        for(var i = 0, l = callbacks.length; i<l; i++)
          callbacks[i].apply(self, arguments);
        cbArgs = Array.prototype.slice.call(arguments);
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

},{"./flatten":1,"./is":2,"./params":3}]},{},[4])(4)
});
