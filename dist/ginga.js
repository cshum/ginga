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
    EventEmitter = _dereq_('events').EventEmitter,
    params  = _dereq_('./params');

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

},{"./flatten":1,"./is":2,"./params":3,"events":5}],5:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[4])(4)
});
