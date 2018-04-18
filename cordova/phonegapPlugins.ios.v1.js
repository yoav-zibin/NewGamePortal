// Platform: ios
// 4450a4cea50616e080a82e8ede9e3d6a1fe3c3ec
/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/
;(function() {
var PLATFORM_VERSION_BUILD_LABEL = '4.5.4';
// file: src/scripts/require.js

/* jshint -W079 */
/* jshint -W020 */

var require;
var define;

(function () {
    var modules = {};
    // Stack of moduleIds currently being built.
    var requireStack = [];
    // Map of module ID -> index into requireStack of modules currently being built.
    var inProgressModules = {};
    var SEPARATOR = '.';

    function build (module) {
        var factory = module.factory;
        var localRequire = function (id) {
            var resultantId = id;
            // Its a relative path, so lop off the last portion and add the id (minus "./")
            if (id.charAt(0) === '.') {
                resultantId = module.id.slice(0, module.id.lastIndexOf(SEPARATOR)) + SEPARATOR + id.slice(2);
            }
            return require(resultantId);
        };
        module.exports = {};
        delete module.factory;
        factory(localRequire, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw 'module ' + id + ' not found';
        } else if (id in inProgressModules) {
            var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw 'Cycle in require graph: ' + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = requireStack.length;
                requireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                requireStack.pop();
            }
        }
        return modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw 'module ' + id + ' already defined';
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

    define.moduleMap = modules;
})();

// Export for use in node
if (typeof module === 'object' && typeof require === 'function') {
    module.exports.require = require;
    module.exports.define = define;
}

// file: src/cordova.js
define("cordova", function(require, exports, module) {

// Workaround for Windows 10 in hosted environment case
// http://www.w3.org/html/wg/drafts/html/master/browsers.html#named-access-on-the-window-object
if (window.cordova && !(window.cordova instanceof HTMLElement)) { // eslint-disable-line no-undef
    throw new Error('cordova already defined');
}

var channel = require('cordova/channel');
var platform = require('cordova/platform');

/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {};
var windowEventHandlers = {};

document.addEventListener = function (evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] !== 'undefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function (evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] !== 'undefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function (evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] !== 'undefined') {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function (evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] !== 'undefined') {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent (type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}

/* eslint-disable no-undef */
var cordova = {
    define: define,
    require: require,
    version: PLATFORM_VERSION_BUILD_LABEL,
    platformVersion: PLATFORM_VERSION_BUILD_LABEL,
    platformId: platform.id,

    /* eslint-enable no-undef */

    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler: function (event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler: function (event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler: function (event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler: function (event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler: function (event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function () {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
            'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     * bNoDetach is required for events which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent: function (type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] !== 'undefined') {
            if (bNoDetach) {
                documentEventHandlers[type].fire(evt);
            } else {
                setTimeout(function () {
                    // Fire deviceready on listeners that were registered before cordova.js was loaded.
                    if (type === 'deviceready') {
                        document.dispatchEvent(evt);
                    }
                    documentEventHandlers[type].fire(evt);
                }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent: function (type, data) {
        var evt = createEvent(type, data);
        if (typeof windowEventHandlers[type] !== 'undefined') {
            setTimeout(function () {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
    // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
    callbackId: Math.floor(Math.random() * 2000000000),
    callbacks: {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     */
    callbackSuccess: function (callbackId, args) {
        cordova.callbackFromNative(callbackId, true, args.status, [args.message], args.keepCallback);
    },

    /**
     * Called by native code when returning error result from an action.
     */
    callbackError: function (callbackId, args) {
        // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
        // Derive success from status.
        cordova.callbackFromNative(callbackId, false, args.status, [args.message], args.keepCallback);
    },

    /**
     * Called by native code when returning the result from an action.
     */
    callbackFromNative: function (callbackId, isSuccess, status, args, keepCallback) {
        try {
            var callback = cordova.callbacks[callbackId];
            if (callback) {
                if (isSuccess && status === cordova.callbackStatus.OK) {
                    callback.success && callback.success.apply(null, args);
                } else if (!isSuccess) {
                    callback.fail && callback.fail.apply(null, args);
                }
                /*
                else
                    Note, this case is intentionally not caught.
                    this can happen if isSuccess is true, but callbackStatus is NO_RESULT
                    which is used to remove a callback from the list without calling the callbacks
                    typically keepCallback is false in this case
                */
                // Clear callback if not expecting any more results
                if (!keepCallback) {
                    delete cordova.callbacks[callbackId];
                }
            }
        } catch (err) {
            var msg = 'Error in ' + (isSuccess ? 'Success' : 'Error') + ' callbackId: ' + callbackId + ' : ' + err;
            console && console.log && console.log(msg);
            cordova.fireWindowEvent('cordovacallbackerror', { 'message': msg });
            throw err;
        }
    },
    addConstructor: function (func) {
        channel.onCordovaReady.subscribe(function () {
            try {
                func();
            } catch (e) {
                console.log('Failed to run constructor: ' + e);
            }
        });
    }
};

module.exports = cordova;

});

// file: src/common/argscheck.js
define("cordova/argscheck", function(require, exports, module) {

var utils = require('cordova/utils');

var moduleExports = module.exports;

var typeMap = {
    'A': 'Array',
    'D': 'Date',
    'N': 'Number',
    'S': 'String',
    'F': 'Function',
    'O': 'Object'
};

function extractParamName (callee, argIndex) {
    return (/.*?\((.*?)\)/).exec(callee)[1].split(', ')[argIndex];
}

function checkArgs (spec, functionName, args, opt_callee) {
    if (!moduleExports.enableChecks) {
        return;
    }
    var errMsg = null;
    var typeName;
    for (var i = 0; i < spec.length; ++i) {
        var c = spec.charAt(i);
        var cUpper = c.toUpperCase();
        var arg = args[i];
        // Asterix means allow anything.
        if (c === '*') {
            continue;
        }
        typeName = utils.typeName(arg);
        if ((arg === null || arg === undefined) && c === cUpper) {
            continue;
        }
        if (typeName !== typeMap[cUpper]) {
            errMsg = 'Expected ' + typeMap[cUpper];
            break;
        }
    }
    if (errMsg) {
        errMsg += ', but got ' + typeName + '.';
        errMsg = 'Wrong type for parameter "' + extractParamName(opt_callee || args.callee, i) + '" of ' + functionName + ': ' + errMsg;
        // Don't log when running unit tests.
        if (typeof jasmine === 'undefined') {
            console.error(errMsg);
        }
        throw TypeError(errMsg);
    }
}

function getValue (value, defaultValue) {
    return value === undefined ? defaultValue : value;
}

moduleExports.checkArgs = checkArgs;
moduleExports.getValue = getValue;
moduleExports.enableChecks = true;

});

// file: src/common/base64.js
define("cordova/base64", function(require, exports, module) {

var base64 = exports;

base64.fromArrayBuffer = function (arrayBuffer) {
    var array = new Uint8Array(arrayBuffer);
    return uint8ToBase64(array);
};

base64.toArrayBuffer = function (str) {
    var decodedStr = typeof atob !== 'undefined' ? atob(str) : Buffer.from(str, 'base64').toString('binary'); // eslint-disable-line no-undef
    var arrayBuffer = new ArrayBuffer(decodedStr.length);
    var array = new Uint8Array(arrayBuffer);
    for (var i = 0, len = decodedStr.length; i < len; i++) {
        array[i] = decodedStr.charCodeAt(i);
    }
    return arrayBuffer;
};

// ------------------------------------------------------------------------------

/* This code is based on the performance tests at http://jsperf.com/b64tests
 * This 12-bit-at-a-time algorithm was the best performing version on all
 * platforms tested.
 */

var b64_6bit = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var b64_12bit;

var b64_12bitTable = function () {
    b64_12bit = [];
    for (var i = 0; i < 64; i++) {
        for (var j = 0; j < 64; j++) {
            b64_12bit[i * 64 + j] = b64_6bit[i] + b64_6bit[j];
        }
    }
    b64_12bitTable = function () { return b64_12bit; };
    return b64_12bit;
};

function uint8ToBase64 (rawData) {
    var numBytes = rawData.byteLength;
    var output = '';
    var segment;
    var table = b64_12bitTable();
    for (var i = 0; i < numBytes - 2; i += 3) {
        segment = (rawData[i] << 16) + (rawData[i + 1] << 8) + rawData[i + 2];
        output += table[segment >> 12];
        output += table[segment & 0xfff];
    }
    if (numBytes - i === 2) {
        segment = (rawData[i] << 16) + (rawData[i + 1] << 8);
        output += table[segment >> 12];
        output += b64_6bit[(segment & 0xfff) >> 6];
        output += '=';
    } else if (numBytes - i === 1) {
        segment = (rawData[i] << 16);
        output += table[segment >> 12];
        output += '==';
    }
    return output;
}

});

// file: src/common/builder.js
define("cordova/builder", function(require, exports, module) {

var utils = require('cordova/utils');

function each (objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            func.apply(context, [objects[prop], prop]);
        }
    }
}

function clobber (obj, key, value) {
    exports.replaceHookForTesting(obj, key);
    var needsProperty = false;
    try {
        obj[key] = value;
    } catch (e) {
        needsProperty = true;
    }
    // Getters can only be overridden by getters.
    if (needsProperty || obj[key] !== value) {
        utils.defineGetter(obj, key, function () {
            return value;
        });
    }
}

function assignOrWrapInDeprecateGetter (obj, key, value, message) {
    if (message) {
        utils.defineGetter(obj, key, function () {
            console.log(message);
            delete obj[key];
            clobber(obj, key, value);
            return value;
        });
    } else {
        clobber(obj, key, value);
    }
}

function include (parent, objects, clobber, merge) {
    each(objects, function (obj, key) {
        try {
            var result = obj.path ? require(obj.path) : {};

            if (clobber) {
                // Clobber if it doesn't exist.
                if (typeof parent[key] === 'undefined') {
                    assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                } else if (typeof obj.path !== 'undefined') {
                    // If merging, merge properties onto parent, otherwise, clobber.
                    if (merge) {
                        recursiveMerge(parent[key], result);
                    } else {
                        assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                    }
                }
                result = parent[key];
            } else {
                // Overwrite if not currently defined.
                if (typeof parent[key] === 'undefined') {
                    assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                } else {
                    // Set result to what already exists, so we can build children into it if they exist.
                    result = parent[key];
                }
            }

            if (obj.children) {
                include(result, obj.children, clobber, merge);
            }
        } catch (e) {
            utils.alert('Exception building Cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge (target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (target.prototype && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                clobber(target.prototype, prop, src[prop]);
            } else {
                if (typeof src[prop] === 'object' && typeof target[prop] === 'object') {
                    recursiveMerge(target[prop], src[prop]);
                } else {
                    clobber(target, prop, src[prop]);
                }
            }
        }
    }
}

exports.buildIntoButDoNotClobber = function (objects, target) {
    include(target, objects, false, false);
};
exports.buildIntoAndClobber = function (objects, target) {
    include(target, objects, true, false);
};
exports.buildIntoAndMerge = function (objects, target) {
    include(target, objects, true, true);
};
exports.recursiveMerge = recursiveMerge;
exports.assignOrWrapInDeprecateGetter = assignOrWrapInDeprecateGetter;
exports.replaceHookForTesting = function () {};

});

// file: src/common/channel.js
define("cordova/channel", function(require, exports, module) {

var utils = require('cordova/utils');
var nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * cordova initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
 * onDeviceReady*              User event fired to indicate that Cordova is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function (type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
};
var channel = {
    /**
     * Calls the provided function only after all of the channels specified
     * have been fired. All channels must be sticky channels.
     */
    join: function (h, c) {
        var len = c.length;
        var i = len;
        var f = function () {
            if (!(--i)) h();
        };
        for (var j = 0; j < len; j++) {
            if (c[j].state === 0) {
                throw Error('Can only use join with sticky channels.');
            }
            c[j].subscribe(f);
        }
        if (!len) h();
    },
    /* eslint-disable no-return-assign */
    create: function (type) {
        return channel[type] = new Channel(type, false);
    },
    createSticky: function (type) {
        return channel[type] = new Channel(type, true);
    },
    /* eslint-enable no-return-assign */
    /**
     * cordova Channels that must fire before "deviceready" is fired.
     */
    deviceReadyChannelsArray: [],
    deviceReadyChannelsMap: {},

    /**
     * Indicate that a feature needs to be initialized before it is ready to be used.
     * This holds up Cordova's "deviceready" event until the feature has been initialized
     * and Cordova.initComplete(feature) is called.
     *
     * @param feature {String}     The unique feature name
     */
    waitForInitialization: function (feature) {
        if (feature) {
            var c = channel[feature] || this.createSticky(feature);
            this.deviceReadyChannelsMap[feature] = c;
            this.deviceReadyChannelsArray.push(c);
        }
    },

    /**
     * Indicate that initialization code has completed and the feature is ready to be used.
     *
     * @param feature {String}     The unique feature name
     */
    initializationComplete: function (feature) {
        var c = this.deviceReadyChannelsMap[feature];
        if (c) {
            c.fire();
        }
    }
};

function checkSubscriptionArgument (argument) {
    if (typeof argument !== 'function' && typeof argument.handleEvent !== 'function') {
        throw new Error(
            'Must provide a function or an EventListener object ' +
                'implementing the handleEvent interface.'
        );
    }
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function (eventListenerOrFunction, eventListener) {
    checkSubscriptionArgument(eventListenerOrFunction);
    var handleEvent, guid;

    if (eventListenerOrFunction && typeof eventListenerOrFunction === 'object') {
        // Received an EventListener object implementing the handleEvent interface
        handleEvent = eventListenerOrFunction.handleEvent;
        eventListener = eventListenerOrFunction;
    } else {
        // Received a function to handle event
        handleEvent = eventListenerOrFunction;
    }

    if (this.state === 2) {
        handleEvent.apply(eventListener || this, this.fireArgs);
        return;
    }

    guid = eventListenerOrFunction.observer_guid;
    if (typeof eventListener === 'object') {
        handleEvent = utils.close(eventListener, handleEvent);
    }

    if (!guid) {
        // First time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    handleEvent.observer_guid = guid;
    eventListenerOrFunction.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = handleEvent;
        this.numHandlers++;
        if (this.numHandlers === 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function (eventListenerOrFunction) {
    checkSubscriptionArgument(eventListenerOrFunction);
    var handleEvent, guid, handler;

    if (eventListenerOrFunction && typeof eventListenerOrFunction === 'object') {
        // Received an EventListener object implementing the handleEvent interface
        handleEvent = eventListenerOrFunction.handleEvent;
    } else {
        // Received a function to handle event
        handleEvent = eventListenerOrFunction;
    }

    guid = handleEvent.observer_guid;
    handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function (e) {
    var fail = false; // eslint-disable-line no-unused-vars
    var fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state === 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state === 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onCordovaReady');

// Event to indicate that all automatically loaded JS plugins are loaded and ready.
// FIXME remove this
channel.createSticky('onPluginsReady');

// Event to indicate that Cordova is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onDOMContentLoaded');

module.exports = channel;

});

// file: /Users/spindori/Documents/Cordova/cordova-ios/cordova-js-src/exec.js
define("cordova/exec", function(require, exports, module) {

/*global require, module, atob, document */

/**
 * Creates a gap bridge iframe used to notify the native code about queued
 * commands.
 */
var cordova = require('cordova'),
    utils = require('cordova/utils'),
    base64 = require('cordova/base64'),
    execIframe,
    commandQueue = [], // Contains pending JS->Native messages.
    isInContextOfEvalJs = 0,
    failSafeTimerId = 0;

function massageArgsJsToNative(args) {
    if (!args || utils.typeName(args) != 'Array') {
        return args;
    }
    var ret = [];
    args.forEach(function(arg, i) {
        if (utils.typeName(arg) == 'ArrayBuffer') {
            ret.push({
                'CDVType': 'ArrayBuffer',
                'data': base64.fromArrayBuffer(arg)
            });
        } else {
            ret.push(arg);
        }
    });
    return ret;
}

function massageMessageNativeToJs(message) {
    if (message.CDVType == 'ArrayBuffer') {
        var stringToArrayBuffer = function(str) {
            var ret = new Uint8Array(str.length);
            for (var i = 0; i < str.length; i++) {
                ret[i] = str.charCodeAt(i);
            }
            return ret.buffer;
        };
        var base64ToArrayBuffer = function(b64) {
            return stringToArrayBuffer(atob(b64));
        };
        message = base64ToArrayBuffer(message.data);
    }
    return message;
}

function convertMessageToArgsNativeToJs(message) {
    var args = [];
    if (!message || !message.hasOwnProperty('CDVType')) {
        args.push(message);
    } else if (message.CDVType == 'MultiPart') {
        message.messages.forEach(function(e) {
            args.push(massageMessageNativeToJs(e));
        });
    } else {
        args.push(massageMessageNativeToJs(message));
    }
    return args;
}

function iOSExec() {

    var successCallback, failCallback, service, action, actionArgs;
    var callbackId = null;
    if (typeof arguments[0] !== 'string') {
        // FORMAT ONE
        successCallback = arguments[0];
        failCallback = arguments[1];
        service = arguments[2];
        action = arguments[3];
        actionArgs = arguments[4];

        // Since we need to maintain backwards compatibility, we have to pass
        // an invalid callbackId even if no callback was provided since plugins
        // will be expecting it. The Cordova.exec() implementation allocates
        // an invalid callbackId and passes it even if no callbacks were given.
        callbackId = 'INVALID';
    } else {
        throw new Error('The old format of this exec call has been removed (deprecated since 2.1). Change to: ' +
            'cordova.exec(null, null, \'Service\', \'action\', [ arg1, arg2 ]);'
        );
    }

    // If actionArgs is not provided, default to an empty array
    actionArgs = actionArgs || [];

    // Register the callbacks and add the callbackId to the positional
    // arguments if given.
    if (successCallback || failCallback) {
        callbackId = service + cordova.callbackId++;
        cordova.callbacks[callbackId] =
            {success:successCallback, fail:failCallback};
    }

    actionArgs = massageArgsJsToNative(actionArgs);

    var command = [callbackId, service, action, actionArgs];

    // Stringify and queue the command. We stringify to command now to
    // effectively clone the command arguments in case they are mutated before
    // the command is executed.
    commandQueue.push(JSON.stringify(command));

    // If we're in the context of a stringByEvaluatingJavaScriptFromString call,
    // then the queue will be flushed when it returns; no need for a poke.
    // Also, if there is already a command in the queue, then we've already
    // poked the native side, so there is no reason to do so again.
    if (!isInContextOfEvalJs && commandQueue.length == 1) {
        pokeNative();
    }
}

// CB-10530
function proxyChanged() {
    var cexec = cordovaExec();
       
    return (execProxy !== cexec && // proxy objects are different
            iOSExec !== cexec      // proxy object is not the current iOSExec
            );
}

// CB-10106
function handleBridgeChange() {
    if (proxyChanged()) {
        var commandString = commandQueue.shift();
        while(commandString) {
            var command = JSON.parse(commandString);
            var callbackId = command[0];
            var service = command[1];
            var action = command[2];
            var actionArgs = command[3];
            var callbacks = cordova.callbacks[callbackId] || {};
            
            execProxy(callbacks.success, callbacks.fail, service, action, actionArgs);
            
            commandString = commandQueue.shift();
        };
        return true;
    }
    
    return false;
}

function pokeNative() {
    // CB-5488 - Don't attempt to create iframe before document.body is available.
    if (!document.body) {
        setTimeout(pokeNative);
        return;
    }
    
    // Check if they've removed it from the DOM, and put it back if so.
    if (execIframe && execIframe.contentWindow) {
        execIframe.contentWindow.location = 'gap://ready';
    } else {
        execIframe = document.createElement('iframe');
        execIframe.style.display = 'none';
        execIframe.src = 'gap://ready';
        document.body.appendChild(execIframe);
    }
    // Use a timer to protect against iframe being unloaded during the poke (CB-7735).
    // This makes the bridge ~ 7% slower, but works around the poke getting lost
    // when the iframe is removed from the DOM.
    // An onunload listener could be used in the case where the iframe has just been
    // created, but since unload events fire only once, it doesn't work in the normal
    // case of iframe reuse (where unload will have already fired due to the attempted
    // navigation of the page).
    failSafeTimerId = setTimeout(function() {
        if (commandQueue.length) {
            // CB-10106 - flush the queue on bridge change
            if (!handleBridgeChange()) {
                pokeNative();
             }
        }
    }, 50); // Making this > 0 improves performance (marginally) in the normal case (where it doesn't fire).
}

iOSExec.nativeFetchMessages = function() {
    // Stop listing for window detatch once native side confirms poke.
    if (failSafeTimerId) {
        clearTimeout(failSafeTimerId);
        failSafeTimerId = 0;
    }
    // Each entry in commandQueue is a JSON string already.
    if (!commandQueue.length) {
        return '';
    }
    var json = '[' + commandQueue.join(',') + ']';
    commandQueue.length = 0;
    return json;
};

iOSExec.nativeCallback = function(callbackId, status, message, keepCallback, debug) {
    return iOSExec.nativeEvalAndFetch(function() {
        var success = status === 0 || status === 1;
        var args = convertMessageToArgsNativeToJs(message);
        function nc2() {
            cordova.callbackFromNative(callbackId, success, status, args, keepCallback);
        }
        setTimeout(nc2, 0);
    });
};

iOSExec.nativeEvalAndFetch = function(func) {
    // This shouldn't be nested, but better to be safe.
    isInContextOfEvalJs++;
    try {
        func();
        return iOSExec.nativeFetchMessages();
    } finally {
        isInContextOfEvalJs--;
    }
};

// Proxy the exec for bridge changes. See CB-10106

function cordovaExec() {
    var cexec = require('cordova/exec');
    var cexec_valid = (typeof cexec.nativeFetchMessages === 'function') && (typeof cexec.nativeEvalAndFetch === 'function') && (typeof cexec.nativeCallback === 'function');
    return (cexec_valid && execProxy !== cexec)? cexec : iOSExec;
}

function execProxy() {
    cordovaExec().apply(null, arguments);
};

execProxy.nativeFetchMessages = function() {
    return cordovaExec().nativeFetchMessages.apply(null, arguments);
};

execProxy.nativeEvalAndFetch = function() {
    return cordovaExec().nativeEvalAndFetch.apply(null, arguments);
};

execProxy.nativeCallback = function() {
    return cordovaExec().nativeCallback.apply(null, arguments);
};

module.exports = execProxy;

});

// file: src/common/exec/proxy.js
define("cordova/exec/proxy", function(require, exports, module) {

// internal map of proxy function
var CommandProxyMap = {};

module.exports = {

    // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
    add: function (id, proxyObj) {
        console.log('adding proxy for ' + id);
        CommandProxyMap[id] = proxyObj;
        return proxyObj;
    },

    // cordova.commandProxy.remove("Accelerometer");
    remove: function (id) {
        var proxy = CommandProxyMap[id];
        delete CommandProxyMap[id];
        CommandProxyMap[id] = null;
        return proxy;
    },

    get: function (service, action) {
        return (CommandProxyMap[service] ? CommandProxyMap[service][action] : null);
    }
};

});

// file: src/common/init.js
define("cordova/init", function(require, exports, module) {

var channel = require('cordova/channel');
var cordova = require('cordova');
var modulemapper = require('cordova/modulemapper');
var platform = require('cordova/platform');
var pluginloader = require('cordova/pluginloader');
var utils = require('cordova/utils');

var platformInitChannelsArray = [channel.onNativeReady, channel.onPluginsReady];

function logUnfiredChannels (arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i].state !== 2) {
            console.log('Channel not fired: ' + arr[i].type);
        }
    }
}

window.setTimeout(function () {
    if (channel.onDeviceReady.state !== 2) {
        console.log('deviceready has not fired after 5 seconds.');
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray);
    }
}, 5000);

// Replace navigator before any modules are required(), to ensure it happens as soon as possible.
// We replace it so that properties that can't be clobbered can instead be overridden.
function replaceNavigator (origNavigator) {
    var CordovaNavigator = function () {};
    CordovaNavigator.prototype = origNavigator;
    var newNavigator = new CordovaNavigator();
    // This work-around really only applies to new APIs that are newer than Function.bind.
    // Without it, APIs such as getGamepads() break.
    if (CordovaNavigator.bind) {
        for (var key in origNavigator) {
            if (typeof origNavigator[key] === 'function') {
                newNavigator[key] = origNavigator[key].bind(origNavigator);
            } else {
                (function (k) {
                    utils.defineGetterSetter(newNavigator, key, function () {
                        return origNavigator[k];
                    });
                })(key);
            }
        }
    }
    return newNavigator;
}

if (window.navigator) {
    window.navigator = replaceNavigator(window.navigator);
}

if (!window.console) {
    window.console = {
        log: function () {}
    };
}
if (!window.console.warn) {
    window.console.warn = function (msg) {
        this.log('warn: ' + msg);
    };
}

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onActivated = cordova.addDocumentEventHandler('activated');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

// Listen for DOMContentLoaded and notify our channel subscribers.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    channel.onDOMContentLoaded.fire();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        channel.onDOMContentLoaded.fire();
    }, false);
}

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any cordova JS is ready.
if (window._nativeReady) {
    channel.onNativeReady.fire();
}

modulemapper.clobbers('cordova', 'cordova');
modulemapper.clobbers('cordova/exec', 'cordova.exec');
modulemapper.clobbers('cordova/exec', 'Cordova.exec');

// Call the platform-specific initialization.
platform.bootstrap && platform.bootstrap();

// Wrap in a setTimeout to support the use-case of having plugin JS appended to cordova.js.
// The delay allows the attached modules to be defined before the plugin loader looks for them.
setTimeout(function () {
    pluginloader.load(function () {
        channel.onPluginsReady.fire();
    });
}, 0);

/**
 * Create all cordova objects once native side is ready.
 */
channel.join(function () {
    modulemapper.mapModules(window);

    platform.initialize && platform.initialize();

    // Fire event to notify that all objects are created
    channel.onCordovaReady.fire();

    // Fire onDeviceReady event once page has fully loaded, all
    // constructors have run and cordova info has been received from native
    // side.
    channel.join(function () {
        require('cordova').fireDocumentEvent('deviceready');
    }, channel.deviceReadyChannelsArray);

}, platformInitChannelsArray);

});

// file: src/common/init_b.js
define("cordova/init_b", function(require, exports, module) {

var channel = require('cordova/channel');
var cordova = require('cordova');
var modulemapper = require('cordova/modulemapper');
var platform = require('cordova/platform');
var pluginloader = require('cordova/pluginloader');
var utils = require('cordova/utils');

var platformInitChannelsArray = [channel.onDOMContentLoaded, channel.onNativeReady, channel.onPluginsReady];

// setting exec
cordova.exec = require('cordova/exec');

function logUnfiredChannels (arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i].state !== 2) {
            console.log('Channel not fired: ' + arr[i].type);
        }
    }
}

window.setTimeout(function () {
    if (channel.onDeviceReady.state !== 2) {
        console.log('deviceready has not fired after 5 seconds.');
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray);
    }
}, 5000);

// Replace navigator before any modules are required(), to ensure it happens as soon as possible.
// We replace it so that properties that can't be clobbered can instead be overridden.
function replaceNavigator (origNavigator) {
    var CordovaNavigator = function () {};
    CordovaNavigator.prototype = origNavigator;
    var newNavigator = new CordovaNavigator();
    // This work-around really only applies to new APIs that are newer than Function.bind.
    // Without it, APIs such as getGamepads() break.
    if (CordovaNavigator.bind) {
        for (var key in origNavigator) {
            if (typeof origNavigator[key] === 'function') {
                newNavigator[key] = origNavigator[key].bind(origNavigator);
            } else {
                (function (k) {
                    utils.defineGetterSetter(newNavigator, key, function () {
                        return origNavigator[k];
                    });
                })(key);
            }
        }
    }
    return newNavigator;
}
if (window.navigator) {
    window.navigator = replaceNavigator(window.navigator);
}

if (!window.console) {
    window.console = {
        log: function () {}
    };
}
if (!window.console.warn) {
    window.console.warn = function (msg) {
        this.log('warn: ' + msg);
    };
}

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onActivated = cordova.addDocumentEventHandler('activated');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

// Listen for DOMContentLoaded and notify our channel subscribers.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    channel.onDOMContentLoaded.fire();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        channel.onDOMContentLoaded.fire();
    }, false);
}

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any cordova JS is ready.
if (window._nativeReady) {
    channel.onNativeReady.fire();
}

// Call the platform-specific initialization.
platform.bootstrap && platform.bootstrap();

// Wrap in a setTimeout to support the use-case of having plugin JS appended to cordova.js.
// The delay allows the attached modules to be defined before the plugin loader looks for them.
setTimeout(function () {
    pluginloader.load(function () {
        channel.onPluginsReady.fire();
    });
}, 0);

/**
 * Create all cordova objects once native side is ready.
 */
channel.join(function () {
    modulemapper.mapModules(window);

    platform.initialize && platform.initialize();

    // Fire event to notify that all objects are created
    channel.onCordovaReady.fire();

    // Fire onDeviceReady event once page has fully loaded, all
    // constructors have run and cordova info has been received from native
    // side.
    channel.join(function () {
        require('cordova').fireDocumentEvent('deviceready');
    }, channel.deviceReadyChannelsArray);

}, platformInitChannelsArray);

});

// file: src/common/modulemapper.js
define("cordova/modulemapper", function(require, exports, module) {

var builder = require('cordova/builder');
var moduleMap = define.moduleMap; // eslint-disable-line no-undef
var symbolList;
var deprecationMap;

exports.reset = function () {
    symbolList = [];
    deprecationMap = {};
};

function addEntry (strategy, moduleName, symbolPath, opt_deprecationMessage) {
    if (!(moduleName in moduleMap)) {
        throw new Error('Module ' + moduleName + ' does not exist.');
    }
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function (moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function (moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function (moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function (moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace (symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) { // eslint-disable-line no-cond-assign
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function (context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy === 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy === 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy === 'd' && !target) || (strategy !== 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function (context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.reset();

});

// file: src/common/modulemapper_b.js
define("cordova/modulemapper_b", function(require, exports, module) {

var builder = require('cordova/builder');
var symbolList = [];
var deprecationMap;

exports.reset = function () {
    symbolList = [];
    deprecationMap = {};
};

function addEntry (strategy, moduleName, symbolPath, opt_deprecationMessage) {
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function (moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function (moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function (moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function (moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace (symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) { // eslint-disable-line no-cond-assign
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function (context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy === 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy === 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy === 'd' && !target) || (strategy !== 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function (context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.reset();

});

// file: /Users/spindori/Documents/Cordova/cordova-ios/cordova-js-src/platform.js
define("cordova/platform", function(require, exports, module) {

module.exports = {
    id: 'ios',
    bootstrap: function () {
        // Attach the console polyfill that is iOS-only to window.console
        // see the file under plugin/ios/console.js
        require('cordova/modulemapper').clobbers('cordova/plugin/ios/console', 'window.console');

        require('cordova/channel').onNativeReady.fire();
    }
};

});

// file: /Users/spindori/Documents/Cordova/cordova-ios/cordova-js-src/plugin/ios/console.js
define("cordova/plugin/ios/console", function(require, exports, module) {

//------------------------------------------------------------------------------

var logger = require('cordova/plugin/ios/logger');

//------------------------------------------------------------------------------
// object that we're exporting
//------------------------------------------------------------------------------
var console = module.exports;

//------------------------------------------------------------------------------
// copy of the original console object
//------------------------------------------------------------------------------
var WinConsole = window.console;

//------------------------------------------------------------------------------
// whether to use the logger
//------------------------------------------------------------------------------
var UseLogger = false;

//------------------------------------------------------------------------------
// Timers
//------------------------------------------------------------------------------
var Timers = {};

//------------------------------------------------------------------------------
// used for unimplemented methods
//------------------------------------------------------------------------------
function noop() {}

//------------------------------------------------------------------------------
// used for unimplemented methods
//------------------------------------------------------------------------------
console.useLogger = function (value) {
    if (arguments.length) UseLogger = !!value;

    if (UseLogger) {
        if (logger.useConsole()) {
            throw new Error("console and logger are too intertwingly");
        }
    }

    return UseLogger;
};

//------------------------------------------------------------------------------
console.log = function() {
    if (logger.useConsole()) return;
    logger.log.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.error = function() {
    if (logger.useConsole()) return;
    logger.error.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.warn = function() {
    if (logger.useConsole()) return;
    logger.warn.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.info = function() {
    if (logger.useConsole()) return;
    logger.info.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.debug = function() {
    if (logger.useConsole()) return;
    logger.debug.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.assert = function(expression) {
    if (expression) return;

    var message = logger.format.apply(logger.format, [].slice.call(arguments, 1));
    console.log("ASSERT: " + message);
};

//------------------------------------------------------------------------------
console.clear = function() {};

//------------------------------------------------------------------------------
console.dir = function(object) {
    console.log("%o", object);
};

//------------------------------------------------------------------------------
console.dirxml = function(node) {
    console.log(node.innerHTML);
};

//------------------------------------------------------------------------------
console.trace = noop;

//------------------------------------------------------------------------------
console.group = console.log;

//------------------------------------------------------------------------------
console.groupCollapsed = console.log;

//------------------------------------------------------------------------------
console.groupEnd = noop;

//------------------------------------------------------------------------------
console.time = function(name) {
    Timers[name] = new Date().valueOf();
};

//------------------------------------------------------------------------------
console.timeEnd = function(name) {
    var timeStart = Timers[name];
    if (!timeStart) {
        console.warn("unknown timer: " + name);
        return;
    }

    var timeElapsed = new Date().valueOf() - timeStart;
    console.log(name + ": " + timeElapsed + "ms");
};

//------------------------------------------------------------------------------
console.timeStamp = noop;

//------------------------------------------------------------------------------
console.profile = noop;

//------------------------------------------------------------------------------
console.profileEnd = noop;

//------------------------------------------------------------------------------
console.count = noop;

//------------------------------------------------------------------------------
console.exception = console.log;

//------------------------------------------------------------------------------
console.table = function(data, columns) {
    console.log("%o", data);
};

//------------------------------------------------------------------------------
// return a new function that calls both functions passed as args
//------------------------------------------------------------------------------
function wrappedOrigCall(orgFunc, newFunc) {
    return function() {
        var args = [].slice.call(arguments);
        try { orgFunc.apply(WinConsole, args); } catch (e) {}
        try { newFunc.apply(console,    args); } catch (e) {}
    };
}

//------------------------------------------------------------------------------
// For every function that exists in the original console object, that
// also exists in the new console object, wrap the new console method
// with one that calls both
//------------------------------------------------------------------------------
for (var key in console) {
    if (typeof WinConsole[key] == "function") {
        console[key] = wrappedOrigCall(WinConsole[key], console[key]);
    }
}

});

// file: /Users/spindori/Documents/Cordova/cordova-ios/cordova-js-src/plugin/ios/logger.js
define("cordova/plugin/ios/logger", function(require, exports, module) {

//------------------------------------------------------------------------------
// The logger module exports the following properties/functions:
//
// LOG                          - constant for the level LOG
// ERROR                        - constant for the level ERROR
// WARN                         - constant for the level WARN
// INFO                         - constant for the level INFO
// DEBUG                        - constant for the level DEBUG
// logLevel()                   - returns current log level
// logLevel(value)              - sets and returns a new log level
// useConsole()                 - returns whether logger is using console
// useConsole(value)            - sets and returns whether logger is using console
// log(message,...)             - logs a message at level LOG
// error(message,...)           - logs a message at level ERROR
// warn(message,...)            - logs a message at level WARN
// info(message,...)            - logs a message at level INFO
// debug(message,...)           - logs a message at level DEBUG
// logLevel(level,message,...)  - logs a message specified level
//
//------------------------------------------------------------------------------

var logger = exports;

var exec    = require('cordova/exec');

var UseConsole   = false;
var UseLogger    = true;
var Queued       = [];
var DeviceReady  = false;
var CurrentLevel;

var originalConsole = console;

/**
 * Logging levels
 */

var Levels = [
    "LOG",
    "ERROR",
    "WARN",
    "INFO",
    "DEBUG"
];

/*
 * add the logging levels to the logger object and
 * to a separate levelsMap object for testing
 */

var LevelsMap = {};
for (var i=0; i<Levels.length; i++) {
    var level = Levels[i];
    LevelsMap[level] = i;
    logger[level]    = level;
}

CurrentLevel = LevelsMap.WARN;

/**
 * Getter/Setter for the logging level
 *
 * Returns the current logging level.
 *
 * When a value is passed, sets the logging level to that value.
 * The values should be one of the following constants:
 *    logger.LOG
 *    logger.ERROR
 *    logger.WARN
 *    logger.INFO
 *    logger.DEBUG
 *
 * The value used determines which messages get printed.  The logging
 * values above are in order, and only messages logged at the logging
 * level or above will actually be displayed to the user.  E.g., the
 * default level is WARN, so only messages logged with LOG, ERROR, or
 * WARN will be displayed; INFO and DEBUG messages will be ignored.
 */
logger.level = function (value) {
    if (arguments.length) {
        if (LevelsMap[value] === null) {
            throw new Error("invalid logging level: " + value);
        }
        CurrentLevel = LevelsMap[value];
    }

    return Levels[CurrentLevel];
};

/**
 * Getter/Setter for the useConsole functionality
 *
 * When useConsole is true, the logger will log via the
 * browser 'console' object.
 */
logger.useConsole = function (value) {
    if (arguments.length) UseConsole = !!value;

    if (UseConsole) {
        if (typeof console == "undefined") {
            throw new Error("global console object is not defined");
        }

        if (typeof console.log != "function") {
            throw new Error("global console object does not have a log function");
        }

        if (typeof console.useLogger == "function") {
            if (console.useLogger()) {
                throw new Error("console and logger are too intertwingly");
            }
        }
    }

    return UseConsole;
};

/**
 * Getter/Setter for the useLogger functionality
 *
 * When useLogger is true, the logger will log via the
 * native Logger plugin.
 */
logger.useLogger = function (value) {
    // Enforce boolean
    if (arguments.length) UseLogger = !!value;
    return UseLogger;
};

/**
 * Logs a message at the LOG level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.log   = function(message) { logWithArgs("LOG",   arguments); };

/**
 * Logs a message at the ERROR level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.error = function(message) { logWithArgs("ERROR", arguments); };

/**
 * Logs a message at the WARN level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.warn  = function(message) { logWithArgs("WARN",  arguments); };

/**
 * Logs a message at the INFO level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.info  = function(message) { logWithArgs("INFO",  arguments); };

/**
 * Logs a message at the DEBUG level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.debug = function(message) { logWithArgs("DEBUG", arguments); };

// log at the specified level with args
function logWithArgs(level, args) {
    args = [level].concat([].slice.call(args));
    logger.logLevel.apply(logger, args);
}

// return the correct formatString for an object
function formatStringForMessage(message) {
    return (typeof message === "string") ? "" : "%o"; 
}

/**
 * Logs a message at the specified level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.logLevel = function(level /* , ... */) {
    // format the message with the parameters
    var formatArgs = [].slice.call(arguments, 1);
    var fmtString = formatStringForMessage(formatArgs[0]);
    if (fmtString.length > 0){
        formatArgs.unshift(fmtString); // add formatString
    }

    var message    = logger.format.apply(logger.format, formatArgs);

    if (LevelsMap[level] === null) {
        throw new Error("invalid logging level: " + level);
    }

    if (LevelsMap[level] > CurrentLevel) return;

    // queue the message if not yet at deviceready
    if (!DeviceReady && !UseConsole) {
        Queued.push([level, message]);
        return;
    }

    // Log using the native logger if that is enabled
    if (UseLogger) {
        exec(null, null, "Console", "logLevel", [level, message]);
    }

    // Log using the console if that is enabled
    if (UseConsole) {
        // make sure console is not using logger
        if (console.useLogger()) {
            throw new Error("console and logger are too intertwingly");
        }

        // log to the console
        switch (level) {
            case logger.LOG:   originalConsole.log(message); break;
            case logger.ERROR: originalConsole.log("ERROR: " + message); break;
            case logger.WARN:  originalConsole.log("WARN: "  + message); break;
            case logger.INFO:  originalConsole.log("INFO: "  + message); break;
            case logger.DEBUG: originalConsole.log("DEBUG: " + message); break;
        }
    }
};


/**
 * Formats a string and arguments following it ala console.log()
 *
 * Any remaining arguments will be appended to the formatted string.
 *
 * for rationale, see FireBug's Console API:
 *    http://getfirebug.com/wiki/index.php/Console_API
 */
logger.format = function(formatString, args) {
    return __format(arguments[0], [].slice.call(arguments,1)).join(' ');
};


//------------------------------------------------------------------------------
/**
 * Formats a string and arguments following it ala vsprintf()
 *
 * format chars:
 *   %j - format arg as JSON
 *   %o - format arg as JSON
 *   %c - format arg as ''
 *   %% - replace with '%'
 * any other char following % will format it's
 * arg via toString().
 *
 * Returns an array containing the formatted string and any remaining
 * arguments.
 */
function __format(formatString, args) {
    if (formatString === null || formatString === undefined) return [""];
    if (arguments.length == 1) return [formatString.toString()];

    if (typeof formatString != "string")
        formatString = formatString.toString();

    var pattern = /(.*?)%(.)(.*)/;
    var rest    = formatString;
    var result  = [];

    while (args.length) {
        var match = pattern.exec(rest);
        if (!match) break;

        var arg   = args.shift();
        rest = match[3];
        result.push(match[1]);

        if (match[2] == '%') {
            result.push('%');
            args.unshift(arg);
            continue;
        }

        result.push(__formatted(arg, match[2]));
    }

    result.push(rest);

    var remainingArgs = [].slice.call(args);
    remainingArgs.unshift(result.join(''));
    return remainingArgs;
}

function __formatted(object, formatChar) {

    try {
        switch(formatChar) {
            case 'j':
            case 'o': return JSON.stringify(object);
            case 'c': return '';
        }
    }
    catch (e) {
        return "error JSON.stringify()ing argument: " + e;
    }

    if ((object === null) || (object === undefined)) {
        return Object.prototype.toString.call(object);
    }

    return object.toString();
}


//------------------------------------------------------------------------------
// when deviceready fires, log queued messages
logger.__onDeviceReady = function() {
    if (DeviceReady) return;

    DeviceReady = true;

    for (var i=0; i<Queued.length; i++) {
        var messageArgs = Queued[i];
        logger.logLevel(messageArgs[0], messageArgs[1]);
    }

    Queued = null;
};

// add a deviceready event to log queued messages
document.addEventListener("deviceready", logger.__onDeviceReady, false);

});

// file: src/common/pluginloader.js
define("cordova/pluginloader", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

// Helper function to inject a <script> tag.
// Exported for testing.
exports.injectScript = function (url, onload, onerror) {
    var script = document.createElement('script');
    // onload fires even when script fails loads with an error.
    script.onload = onload;
    // onerror fires for malformed URLs.
    script.onerror = onerror;
    script.src = url;
    document.head.appendChild(script);
};

function injectIfNecessary (id, url, onload, onerror) {
    onerror = onerror || onload;
    if (id in define.moduleMap) { // eslint-disable-line no-undef
        onload();
    } else {
        exports.injectScript(url, function () {
            if (id in define.moduleMap) { // eslint-disable-line no-undef
                onload();
            } else {
                onerror();
            }
        }, onerror);
    }
}

function onScriptLoadingComplete (moduleList, finishPluginLoading) {
    // Loop through all the plugins and then through their clobbers and merges.
    for (var i = 0, module; module = moduleList[i]; i++) { // eslint-disable-line no-cond-assign
        if (module.clobbers && module.clobbers.length) {
            for (var j = 0; j < module.clobbers.length; j++) {
                modulemapper.clobbers(module.id, module.clobbers[j]);
            }
        }

        if (module.merges && module.merges.length) {
            for (var k = 0; k < module.merges.length; k++) {
                modulemapper.merges(module.id, module.merges[k]);
            }
        }

        // Finally, if runs is truthy we want to simply require() the module.
        if (module.runs) {
            modulemapper.runs(module.id);
        }
    }

    finishPluginLoading();
}

// Handler for the cordova_plugins.js content.
// See plugman's plugin_loader.js for the details of this object.
// This function is only called if the really is a plugins array that isn't empty.
// Otherwise the onerror response handler will just call finishPluginLoading().
function handlePluginsObject (path, moduleList, finishPluginLoading) {
    // Now inject the scripts.
    var scriptCounter = moduleList.length;

    if (!scriptCounter) {
        finishPluginLoading();
        return;
    }
    function scriptLoadedCallback () {
        if (!--scriptCounter) {
            onScriptLoadingComplete(moduleList, finishPluginLoading);
        }
    }

    for (var i = 0; i < moduleList.length; i++) {
        injectIfNecessary(moduleList[i].id, path + moduleList[i].file, scriptLoadedCallback);
    }
}

function findCordovaPath () {
    var path = null;
    var scripts = document.getElementsByTagName('script');
    var term = '/cordova.js';
    for (var n = scripts.length - 1; n > -1; n--) {
        var src = scripts[n].src.replace(/\?.*$/, ''); // Strip any query param (CB-6007).
        if (src.indexOf(term) === (src.length - term.length)) {
            path = src.substring(0, src.length - term.length) + '/';
            break;
        }
    }
    return path;
}

// Tries to load all plugins' js-modules.
// This is an async process, but onDeviceReady is blocked on onPluginsReady.
// onPluginsReady is fired when there are no plugins to load, or they are all done.
exports.load = function (callback) {
    var pathPrefix = findCordovaPath();
    if (pathPrefix === null) {
        console.log('Could not find cordova.js script tag. Plugin loading may fail.');
        pathPrefix = '';
    }
    injectIfNecessary('cordova/plugin_list', pathPrefix + 'cordova_plugins.js', function () {
        var moduleList = require('cordova/plugin_list');
        handlePluginsObject(pathPrefix, moduleList, callback);
    }, callback);
};

});

// file: src/common/pluginloader_b.js
define("cordova/pluginloader_b", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

// Handler for the cordova_plugins.js content.
// See plugman's plugin_loader.js for the details of this object.
function handlePluginsObject (moduleList) {
    // if moduleList is not defined or empty, we've nothing to do
    if (!moduleList || !moduleList.length) {
        return;
    }

    // Loop through all the modules and then through their clobbers and merges.
    for (var i = 0, module; module = moduleList[i]; i++) { // eslint-disable-line no-cond-assign
        if (module.clobbers && module.clobbers.length) {
            for (var j = 0; j < module.clobbers.length; j++) {
                modulemapper.clobbers(module.id, module.clobbers[j]);
            }
        }

        if (module.merges && module.merges.length) {
            for (var k = 0; k < module.merges.length; k++) {
                modulemapper.merges(module.id, module.merges[k]);
            }
        }

        // Finally, if runs is truthy we want to simply require() the module.
        if (module.runs) {
            modulemapper.runs(module.id);
        }
    }
}

// Loads all plugins' js-modules. Plugin loading is syncronous in browserified bundle
// but the method accepts callback to be compatible with non-browserify flow.
// onDeviceReady is blocked on onPluginsReady. onPluginsReady is fired when there are
// no plugins to load, or they are all done.
exports.load = function (callback) {
    var moduleList = require('cordova/plugin_list');
    handlePluginsObject(moduleList);

    callback();
};

});

// file: src/common/urlutil.js
define("cordova/urlutil", function(require, exports, module) {

/**
 * For already absolute URLs, returns what is passed in.
 * For relative URLs, converts them to absolute ones.
 */
exports.makeAbsolute = function makeAbsolute (url) {
    var anchorEl = document.createElement('a');
    anchorEl.href = url;
    return anchorEl.href;
};

});

// file: src/common/utils.js
define("cordova/utils", function(require, exports, module) {

var utils = exports;

/**
 * Defines a property getter / setter for obj[key].
 */
utils.defineGetterSetter = function (obj, key, getFunc, opt_setFunc) {
    if (Object.defineProperty) {
        var desc = {
            get: getFunc,
            configurable: true
        };
        if (opt_setFunc) {
            desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
    } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
            obj.__defineSetter__(key, opt_setFunc);
        }
    }
};

/**
 * Defines a property getter for obj[key].
 */
utils.defineGetter = utils.defineGetterSetter;

utils.arrayIndexOf = function (a, item) {
    if (a.indexOf) {
        return a.indexOf(item);
    }
    var len = a.length;
    for (var i = 0; i < len; ++i) {
        if (a[i] === item) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns whether the item was found in the array.
 */
utils.arrayRemove = function (a, item) {
    var index = utils.arrayIndexOf(a, item);
    if (index !== -1) {
        a.splice(index, 1);
    }
    return index !== -1;
};

utils.typeName = function (val) {
    return Object.prototype.toString.call(val).slice(8, -1);
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = Array.isArray ||
                function (a) { return utils.typeName(a) === 'Array'; };

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function (d) {
    return (d instanceof Date);
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function (obj) {
    if (!obj || typeof obj === 'function' || utils.isDate(obj) || typeof obj !== 'object') {
        return obj;
    }

    var retVal, i;

    if (utils.isArray(obj)) {
        retVal = [];
        for (i = 0; i < obj.length; ++i) {
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for (i in obj) {
        // https://issues.apache.org/jira/browse/CB-11522 'unknown' type may be returned in
        // custom protocol activation case on Windows Phone 8.1 causing "No such interface supported" exception
        // on cloning.
        if ((!(i in retVal) || retVal[i] !== obj[i]) && typeof obj[i] !== 'undefined' && typeof obj[i] !== 'unknown') { // eslint-disable-line valid-typeof
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function (context, func, params) {
    return function () {
        var args = params || arguments;
        return func.apply(context, args);
    };
};

// ------------------------------------------------------------------------------
function UUIDcreatePart (length) {
    var uuidpart = '';
    for (var i = 0; i < length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length === 1) {
            uuidchar = '0' + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}

/**
 * Create a UUID
 */
utils.createUUID = function () {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function () {
    // proxy used to establish prototype chain
    var F = function () {};
    // extend Child from Parent
    return function (Child, Parent) {

        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function (msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};

});

window.cordova = require('cordova');
// file: src/scripts/bootstrap.js

require('cordova/init');

})();
;
cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "cordova-plugin-contacts.contacts",
    "file": "plugins/cordova-plugin-contacts/www/contacts.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "navigator.contacts"
    ]
  },
  {
    "id": "cordova-plugin-contacts.Contact",
    "file": "plugins/cordova-plugin-contacts/www/Contact.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "Contact"
    ]
  },
  {
    "id": "cordova-plugin-contacts.convertUtils",
    "file": "plugins/cordova-plugin-contacts/www/convertUtils.js",
    "pluginId": "cordova-plugin-contacts"
  },
  {
    "id": "cordova-plugin-contacts.ContactAddress",
    "file": "plugins/cordova-plugin-contacts/www/ContactAddress.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "ContactAddress"
    ]
  },
  {
    "id": "cordova-plugin-contacts.ContactError",
    "file": "plugins/cordova-plugin-contacts/www/ContactError.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "ContactError"
    ]
  },
  {
    "id": "cordova-plugin-contacts.ContactField",
    "file": "plugins/cordova-plugin-contacts/www/ContactField.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "ContactField"
    ]
  },
  {
    "id": "cordova-plugin-contacts.ContactFindOptions",
    "file": "plugins/cordova-plugin-contacts/www/ContactFindOptions.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "ContactFindOptions"
    ]
  },
  {
    "id": "cordova-plugin-contacts.ContactName",
    "file": "plugins/cordova-plugin-contacts/www/ContactName.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "ContactName"
    ]
  },
  {
    "id": "cordova-plugin-contacts.ContactOrganization",
    "file": "plugins/cordova-plugin-contacts/www/ContactOrganization.js",
    "pluginId": "cordova-plugin-contacts",
    "clobbers": [
      "ContactOrganization"
    ]
  },
  {
    "id": "cordova-plugin-contacts.ContactFieldType",
    "file": "plugins/cordova-plugin-contacts/www/ContactFieldType.js",
    "pluginId": "cordova-plugin-contacts",
    "merges": [
      ""
    ]
  },
  {
    "id": "cordova-plugin-contacts.contacts-ios",
    "file": "plugins/cordova-plugin-contacts/www/ios/contacts.js",
    "pluginId": "cordova-plugin-contacts",
    "merges": [
      "navigator.contacts"
    ]
  },
  {
    "id": "cordova-plugin-contacts.Contact-iOS",
    "file": "plugins/cordova-plugin-contacts/www/ios/Contact.js",
    "pluginId": "cordova-plugin-contacts",
    "merges": [
      "Contact"
    ]
  },
  {
    "id": "cordova-plugin-iosrtc.Plugin",
    "file": "plugins/cordova-plugin-iosrtc/dist/cordova-plugin-iosrtc.js",
    "pluginId": "cordova-plugin-iosrtc",
    "clobbers": [
      "cordova.plugins.iosrtc"
    ]
  },
  {
    "id": "cordova-sms-plugin.Sms",
    "file": "plugins/cordova-sms-plugin/www/sms.js",
    "pluginId": "cordova-sms-plugin",
    "clobbers": [
      "window.sms"
    ]
  },
  {
    "id": "cordova-universal-links-plugin.universalLinks",
    "file": "plugins/cordova-universal-links-plugin/www/universal_links.js",
    "pluginId": "cordova-universal-links-plugin",
    "clobbers": [
      "universalLinks"
    ]
  },
  {
    "id": "phonegap-plugin-push.PushNotification",
    "file": "plugins/phonegap-plugin-push/www/push.js",
    "pluginId": "phonegap-plugin-push",
    "clobbers": [
      "PushNotification"
    ]
  },
  {
    "id": "cordova-plugin-device.device",
    "file": "plugins/cordova-plugin-device/www/device.js",
    "pluginId": "cordova-plugin-device",
    "clobbers": [
      "device"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-contacts": "3.0.1",
  "cordova-plugin-iosrtc": "4.0.2",
  "cordova-plugin-whitelist": "1.3.3",
  "cordova-sms-plugin": "0.1.11",
  "cordova-universal-links-plugin": "1.2.1",
  "phonegap-plugin-push": "2.2.2",
  "cordova-plugin-device": "2.0.1"
};
// BOTTOM OF METADATA
});
;
cordova.define("cordova-plugin-contacts.Contact", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    ContactError = require('./ContactError'),
    utils = require('cordova/utils'),
    convertUtils = require('./convertUtils');

/**
* Contains information about a single contact.
* @constructor
* @param {DOMString} id unique identifier
* @param {DOMString} displayName
* @param {ContactName} name
* @param {DOMString} nickname
* @param {Array.<ContactField>} phoneNumbers array of phone numbers
* @param {Array.<ContactField>} emails array of email addresses
* @param {Array.<ContactAddress>} addresses array of addresses
* @param {Array.<ContactField>} ims instant messaging user ids
* @param {Array.<ContactOrganization>} organizations
* @param {DOMString} birthday contact's birthday
* @param {DOMString} note user notes about contact
* @param {Array.<ContactField>} photos
* @param {Array.<ContactField>} categories
* @param {Array.<ContactField>} urls contact's web sites
*/
var Contact = function (id, displayName, name, nickname, phoneNumbers, emails, addresses,
    ims, organizations, birthday, note, photos, categories, urls) {
    this.id = id || null;
    this.rawId = null;
    this.displayName = displayName || null;
    this.name = name || null; // ContactName
    this.nickname = nickname || null;
    this.phoneNumbers = phoneNumbers || null; // ContactField[]
    this.emails = emails || null; // ContactField[]
    this.addresses = addresses || null; // ContactAddress[]
    this.ims = ims || null; // ContactField[]
    this.organizations = organizations || null; // ContactOrganization[]
    this.birthday = birthday || null;
    this.note = note || null;
    this.photos = photos || null; // ContactField[]
    this.categories = categories || null; // ContactField[]
    this.urls = urls || null; // ContactField[]
};

/**
* Removes contact from device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.remove = function(successCB, errorCB) {
    argscheck.checkArgs('FF', 'Contact.remove', arguments);
    var fail = errorCB && function(code) {
        errorCB(new ContactError(code));
    };
    if (this.id === null) {
        fail(ContactError.UNKNOWN_ERROR);
    }
    else {
        exec(successCB, fail, "Contacts", "remove", [this.id]);
    }
};

/**
* Creates a deep copy of this Contact.
* With the contact ID set to null.
* @return copy of this Contact
*/
Contact.prototype.clone = function() {
    var clonedContact = utils.clone(this);
    clonedContact.id = null;
    clonedContact.rawId = null;

    function nullIds(arr) {
        if (arr) {
            for (var i = 0; i < arr.length; ++i) {
                arr[i].id = null;
            }
        }
    }

    // Loop through and clear out any id's in phones, emails, etc.
    nullIds(clonedContact.phoneNumbers);
    nullIds(clonedContact.emails);
    nullIds(clonedContact.addresses);
    nullIds(clonedContact.ims);
    nullIds(clonedContact.organizations);
    nullIds(clonedContact.categories);
    nullIds(clonedContact.photos);
    nullIds(clonedContact.urls);
    return clonedContact;
};

/**
* Persists contact to device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.save = function(successCB, errorCB) {
    argscheck.checkArgs('FFO', 'Contact.save', arguments);
    var fail = errorCB && function(code) {
        errorCB(new ContactError(code));
    };
    var success = function(result) {
        if (result) {
            if (successCB) {
                var fullContact = require('./contacts').create(result);
                successCB(convertUtils.toCordovaFormat(fullContact));
            }
        }
        else {
            // no Entry object returned
            fail(ContactError.UNKNOWN_ERROR);
        }
    };
    var dupContact = convertUtils.toNativeFormat(utils.clone(this));
    exec(success, fail, "Contacts", "save", [dupContact]);
};


module.exports = Contact;

});

;
cordova.define("cordova-plugin-contacts.ContactAddress", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/**
* Contact address.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code
* @param formatted // NOTE: not a W3C standard
* @param streetAddress
* @param locality
* @param region
* @param postalCode
* @param country
*/

var ContactAddress = function(pref, type, formatted, streetAddress, locality, region, postalCode, country) {
    this.id = null;
    this.pref = (typeof pref != 'undefined' ? pref : false);
    this.type = type || null;
    this.formatted = formatted || null;
    this.streetAddress = streetAddress || null;
    this.locality = locality || null;
    this.region = region || null;
    this.postalCode = postalCode || null;
    this.country = country || null;
};

module.exports = ContactAddress;

});

;
cordova.define("cordova-plugin-contacts.ContactError", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/**
 *  ContactError.
 *  An error code assigned by an implementation when an error has occurred
 * @constructor
 */
var ContactError = function(err) {
    this.code = (typeof err != 'undefined' ? err : null);
};

/**
 * Error codes
 */
ContactError.UNKNOWN_ERROR = 0;
ContactError.INVALID_ARGUMENT_ERROR = 1;
ContactError.TIMEOUT_ERROR = 2;
ContactError.PENDING_OPERATION_ERROR = 3;
ContactError.IO_ERROR = 4;
ContactError.NOT_SUPPORTED_ERROR = 5;
ContactError.OPERATION_CANCELLED_ERROR = 6;
ContactError.PERMISSION_DENIED_ERROR = 20;

module.exports = ContactError;

});

;
cordova.define("cordova-plugin-contacts.ContactField", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/**
* Generic contact field.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code // NOTE: not a W3C standard
* @param type
* @param value
* @param pref
*/
var ContactField = function(type, value, pref) {
    this.id = null;
    this.type = (type && type.toString()) || null;
    this.value = (value && value.toString()) || null;
    this.pref = (typeof pref != 'undefined' ? pref : false);
};

module.exports = ContactField;

});

;
cordova.define("cordova-plugin-contacts.ContactFieldType", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

    // Possible field names for various platforms.
    // Some field names are platform specific

    var fieldType = {
        addresses:      "addresses",
        birthday:       "birthday",
        categories:     "categories",
        country:        "country",
        department:     "department",
        displayName:    "displayName",
        emails:         "emails",
        familyName:     "familyName",
        formatted:      "formatted",
        givenName:      "givenName",
        honorificPrefix: "honorificPrefix",
        honorificSuffix: "honorificSuffix",
        id:             "id",
        ims:            "ims",
        locality:       "locality",
        middleName:     "middleName",
        name:           "name",
        nickname:       "nickname",
        note:           "note",
        organizations:  "organizations",
        phoneNumbers:   "phoneNumbers",
        photos:         "photos",
        postalCode:     "postalCode",
        region:         "region",
        streetAddress:  "streetAddress",
        title:          "title",
        urls:           "urls"
    };

    module.exports = fieldType;

});

;
cordova.define("cordova-plugin-contacts.ContactFindOptions", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/**
 * ContactFindOptions.
 * @constructor
 * @param filter used to match contacts against
 * @param multiple boolean used to determine if more than one contact should be returned
 * @param desiredFields 
 * @param hasPhoneNumber boolean used to filter the search and only return contacts that have a phone number informed
 */

var ContactFindOptions = function(filter, multiple, desiredFields, hasPhoneNumber) {
    this.filter = filter || '';
    this.multiple = (typeof multiple != 'undefined' ? multiple : false);
    this.desiredFields = typeof desiredFields != 'undefined' ? desiredFields : [];
    this.hasPhoneNumber = typeof hasPhoneNumber != 'undefined' ? hasPhoneNumber : false;
};

module.exports = ContactFindOptions;

});

;
cordova.define("cordova-plugin-contacts.ContactName", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/**
* Contact name.
* @constructor
* @param formatted // NOTE: not part of W3C standard
* @param familyName
* @param givenName
* @param middle
* @param prefix
* @param suffix
*/
var ContactName = function(formatted, familyName, givenName, middle, prefix, suffix) {
    this.formatted = formatted || null;
    this.familyName = familyName || null;
    this.givenName = givenName || null;
    this.middleName = middle || null;
    this.honorificPrefix = prefix || null;
    this.honorificSuffix = suffix || null;
};

module.exports = ContactName;

});

;
cordova.define("cordova-plugin-contacts.ContactOrganization", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/**
* Contact organization.
* @constructor
* @param pref
* @param type
* @param name
* @param dept
* @param title
*/

var ContactOrganization = function(pref, type, name, dept, title) {
    this.id = null;
    this.pref = (typeof pref != 'undefined' ? pref : false);
    this.type = type || null;
    this.name = name || null;
    this.department = dept || null;
    this.title = title || null;
};

module.exports = ContactOrganization;

});

;
cordova.define("cordova-plugin-contacts.contacts", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    ContactError = require('./ContactError'),
    Contact = require('./Contact'),
    fieldType = require('./ContactFieldType'),
    convertUtils = require('./convertUtils');

/**
* Represents a group of Contacts.
* @constructor
*/
var contacts = {
    fieldType: fieldType,
    /**
     * Returns an array of Contacts matching the search criteria.
     * @param fields that should be searched
     * @param successCB success callback
     * @param errorCB error callback
     * @param {ContactFindOptions} options that can be applied to contact searching
     * @return array of Contacts matching search criteria
     */
    find: function(fields, successCB, errorCB, options) {
        argscheck.checkArgs('afFO', 'contacts.find', arguments);
        if (!fields.length) {
            if (errorCB) {
                errorCB(new ContactError(ContactError.INVALID_ARGUMENT_ERROR));
            }
        } else {
            // missing 'options' param means return all contacts
            options = options || { filter: '', multiple: true };
            var win = function(result) {
                var cs = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    cs.push(convertUtils.toCordovaFormat(contacts.create(result[i])));
                }
                successCB(cs);
            };
            exec(win, errorCB, "Contacts", "search", [fields, options]);
        }
    },
    
    /**
     * This function picks contact from phone using contact picker UI
     * @returns new Contact object
     */
    pickContact: function (successCB, errorCB) {

        argscheck.checkArgs('fF', 'contacts.pick', arguments);

        var win = function (result) {
            // if Contacts.pickContact return instance of Contact object
            // don't create new Contact object, use current
            var contact = result instanceof Contact ? result : contacts.create(result);
            successCB(convertUtils.toCordovaFormat(contact));
        };
        exec(win, errorCB, "Contacts", "pickContact", []);
    },

    /**
     * This function creates a new contact, but it does not persist the contact
     * to device storage. To persist the contact to device storage, invoke
     * contact.save().
     * @param properties an object whose properties will be examined to create a new Contact
     * @returns new Contact object
     */
    create: function(properties) {
        argscheck.checkArgs('O', 'contacts.create', arguments);
        var contact = new Contact();
        for (var i in properties) {
            if (typeof contact[i] !== 'undefined' && properties.hasOwnProperty(i)) {
                contact[i] = properties[i];
            }
        }
        return contact;
    }
};

module.exports = contacts;

});

;
cordova.define("cordova-plugin-contacts.convertUtils", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var utils = require('cordova/utils');

module.exports = {
    /**
    * Converts primitives into Complex Object
    * Currently only used for Date fields
    */
    toCordovaFormat: function (contact) {
        var value = contact.birthday;
        if (value !== null) {
            try {
              contact.birthday = new Date(parseFloat(value));
              
              //we might get 'Invalid Date' which does not throw an error
              //and is an instance of Date.
              if (isNaN(contact.birthday.getTime())) {
                contact.birthday = null;
              }

            } catch (exception){
              console.log("Cordova Contact toCordovaFormat error: exception creating date.");
            }
        }
        return contact;
    },

    /**
    * Converts Complex objects into primitives
    * Only conversion at present is for Dates.
    **/
    toNativeFormat: function (contact) {
        var value = contact.birthday;
        if (value !== null) {
            // try to make it a Date object if it is not already
            if (!utils.isDate(value)){
                try {
                    value = new Date(value);
                } catch(exception){
                    value = null;
                }
            }
            if (utils.isDate(value)){
                value = value.valueOf(); // convert to milliseconds
            }
            contact.birthday = value;
        }
        return contact;
    }
};

});

;
cordova.define("cordova-plugin-contacts.Contact-iOS", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var exec = require('cordova/exec'),
    ContactError = require('./ContactError');

/**
 * Provides iOS Contact.display API.
 */
module.exports = {
    display : function(errorCB, options) {
        /*
         *    Display a contact using the iOS Contact Picker UI
         *    NOT part of W3C spec so no official documentation
         *
         *    @param errorCB error callback
         *    @param options object
         *    allowsEditing: boolean AS STRING
         *        "true" to allow editing the contact
         *        "false" (default) display contact
         */

        if (this.id === null) {
            if (typeof errorCB === "function") {
                var errorObj = new ContactError(ContactError.UNKNOWN_ERROR);
                errorCB(errorObj);
            }
        }
        else {
            exec(null, errorCB, "Contacts","displayContact", [this.id, options]);
        }
    }
};

});

;
cordova.define("cordova-plugin-contacts.contacts-ios", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var exec = require('cordova/exec');

/**
 * Provides iOS enhanced contacts API.
 */
module.exports = {
    newContactUI : function(successCallback) {
        /*
         *    Create a contact using the iOS Contact Picker UI
         *    NOT part of W3C spec so no official documentation
         *
         * returns:  the id of the created contact as param to successCallback
         */
        exec(successCallback, null, "Contacts","newContact", []);
    },
    chooseContact : function(successCallback, options) {
        /*
         *    Select a contact using the iOS Contact Picker UI
         *    NOT part of W3C spec so no official documentation
         *
         *    @param errorCB error callback
         *    @param options object
         *    allowsEditing: boolean AS STRING
         *        "true" to allow editing the contact
         *        "false" (default) display contact
         *      fields: array of fields to return in contact object (see ContactOptions.fields)
         *
         *    @returns
         *        id of contact selected
         *        ContactObject
         *            if no fields provided contact contains just id information
         *            if fields provided contact object contains information for the specified fields
         *
         */
         var win = function(result) {
             var fullContact = require('./contacts').create(result);
            successCallback(fullContact.id, fullContact);
       };
        exec(win, null, "Contacts","chooseContact", [options]);
    }
};

});

;
cordova.define("cordova-plugin-device.device", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var argscheck = require('cordova/argscheck');
var channel = require('cordova/channel');
var utils = require('cordova/utils');
var exec = require('cordova/exec');
var cordova = require('cordova');

channel.createSticky('onCordovaInfoReady');
// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function Device () {
    this.available = false;
    this.platform = null;
    this.version = null;
    this.uuid = null;
    this.cordova = null;
    this.model = null;
    this.manufacturer = null;
    this.isVirtual = null;
    this.serial = null;

    var me = this;

    channel.onCordovaReady.subscribe(function () {
        me.getInfo(function (info) {
            // ignoring info.cordova returning from native, we should use value from cordova.version defined in cordova.js
            // TODO: CB-5105 native implementations should not return info.cordova
            var buildLabel = cordova.version;
            me.available = true;
            me.platform = info.platform;
            me.version = info.version;
            me.uuid = info.uuid;
            me.cordova = buildLabel;
            me.model = info.model;
            me.isVirtual = info.isVirtual;
            me.manufacturer = info.manufacturer || 'unknown';
            me.serial = info.serial || 'unknown';
            channel.onCordovaInfoReady.fire();
        }, function (e) {
            me.available = false;
            utils.alert('[ERROR] Error initializing Cordova: ' + e);
        });
    });
}

/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
Device.prototype.getInfo = function (successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'Device.getInfo', arguments);
    exec(successCallback, errorCallback, 'Device', 'getDeviceInfo', []);
};

module.exports = new Device();

});

;
cordova.define("cordova-plugin-iosrtc.Plugin", function(require, exports, module) {
/*
 * cordova-plugin-iosrtc v4.0.2
 * Cordova iOS plugin exposing the full WebRTC W3C JavaScript APIs
 * Copyright 2015-2017 eFace2Face, Inc. (https://eface2face.com)
 * Copyright 2017 BasqueVoIPMafia (https://github.com/BasqueVoIPMafia)
 * License MIT
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.iosrtc = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * Expose an object with WebRTC Errors.
 */
var Errors = module.exports = {},


/**
 * Local variables.
 */
	IntermediateInheritor = function () {};


IntermediateInheritor.prototype = Error.prototype;


/**
 * Create error classes.
 */
addError('InvalidStateError');
addError('InvalidSessionDescriptionError');
addError('InternalError');
addError('MediaStreamError');


function addError(name) {
	Errors[name] = function () {
		var tmp = Error.apply(this, arguments);

		this.name = tmp.name = name;
		this.message = tmp.message;

		Object.defineProperty(this, 'stack', {
			get: function () {
				return tmp.stack;
			}
		});

		return this;
	};

	Errors[name].prototype = new IntermediateInheritor();
}

},{}],2:[function(_dereq_,module,exports){
/**
 * Expose the MediaDeviceInfo class.
 */
module.exports = MediaDeviceInfo;


function MediaDeviceInfo(data) {
	data = data || {};

	Object.defineProperties(this, {
		// MediaDeviceInfo spec.
		deviceId: {
			value: data.deviceId
		},
		kind: {
			value: data.kind
		},
		label: {
			value: data.label
		},
		groupId: {
			value: data.groupId || ''
		},
		// SourceInfo old spec.
		id: {
			value: data.deviceId
		},
		// Deprecated, but useful until there is an alternative
		facing: {
			value: ''
		}
	});
}

},{}],3:[function(_dereq_,module,exports){
/**
 * Expose the MediaStream class.
 * Make MediaStream be a Blob so it can be consumed by URL.createObjectURL().
 */
var MediaStream = module.exports = window.Blob,


/**
 * Spec: http://w3c.github.io/mediacapture-main/#mediastream
 */


/**
 * Dependencies.
 */
	debug = _dereq_('debug')('iosrtc:MediaStream'),
	exec = _dereq_('cordova/exec'),
	EventTarget = _dereq_('yaeti').EventTarget,
	MediaStreamTrack = _dereq_('./MediaStreamTrack'),


/**
 * Local variables.
 */

	// Dictionary of MediaStreams (provided via setMediaStreams() class method).
	// - key: MediaStream blobId.
	// - value: MediaStream.
	mediaStreams;


/**
 * Class methods.
 */


MediaStream.setMediaStreams = function (_mediaStreams) {
	mediaStreams = _mediaStreams;
};


MediaStream.create = function (dataFromEvent) {
	debug('create() | [dataFromEvent:%o]', dataFromEvent);

	var stream,
		blobId = 'MediaStream_' + dataFromEvent.id,
		trackId,
		track;

	// Note that this is the Blob constructor.
	stream = new MediaStream([blobId], {
		type: 'stream'
	});

	// Store the stream into the dictionary.
	mediaStreams[blobId] = stream;

	// Make it an EventTarget.
	EventTarget.call(stream);

	// Public atributes.
	stream.id = dataFromEvent.id;
	stream.label = dataFromEvent.id;  // Backwards compatibility.
	stream.active = true;

	// Public but internal attributes.
	stream.connected = false;

	// Private attributes.
	stream._blobId = blobId;
	stream._audioTracks = {};
	stream._videoTracks = {};

	for (trackId in dataFromEvent.audioTracks) {
		if (dataFromEvent.audioTracks.hasOwnProperty(trackId)) {
			track = new MediaStreamTrack(dataFromEvent.audioTracks[trackId]);

			stream._audioTracks[track.id] = track;

			addListenerForTrackEnded.call(stream, track);
		}
	}

	for (trackId in dataFromEvent.videoTracks) {
		if (dataFromEvent.videoTracks.hasOwnProperty(trackId)) {
			track = new MediaStreamTrack(dataFromEvent.videoTracks[trackId]);

			stream._videoTracks[track.id] = track;

			addListenerForTrackEnded.call(stream, track);
		}
	}

	function onResultOK(data) {
		onEvent.call(stream, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'MediaStream_setListener', [stream.id]);

	return stream;
};


MediaStream.prototype.getBlobId = function () {
	return this._blobId;
};

MediaStream.prototype.getAudioTracks = function () {
	debug('getAudioTracks()');

	var tracks = [],
		id;

	for (id in this._audioTracks) {
		if (this._audioTracks.hasOwnProperty(id)) {
			tracks.push(this._audioTracks[id]);
		}
	}

	return tracks;
};


MediaStream.prototype.getVideoTracks = function () {
	debug('getVideoTracks()');

	var tracks = [],
		id;

	for (id in this._videoTracks) {
		if (this._videoTracks.hasOwnProperty(id)) {
			tracks.push(this._videoTracks[id]);
		}
	}

	return tracks;
};


MediaStream.prototype.getTracks = function () {
	debug('getTracks()');

	var tracks = [],
		id;

	for (id in this._audioTracks) {
		if (this._audioTracks.hasOwnProperty(id)) {
			tracks.push(this._audioTracks[id]);
		}
	}

	for (id in this._videoTracks) {
		if (this._videoTracks.hasOwnProperty(id)) {
			tracks.push(this._videoTracks[id]);
		}
	}

	return tracks;
};


MediaStream.prototype.getTrackById = function (id) {
	debug('getTrackById()');

	return this._audioTracks[id] || this._videoTracks[id] || null;
};


MediaStream.prototype.addTrack = function (track) {
	debug('addTrack() [track:%o]', track);

	if (!(track instanceof MediaStreamTrack)) {
		throw new Error('argument must be an instance of MediaStreamTrack');
	}

	if (this._audioTracks[track.id] || this._videoTracks[track.id]) {
		return;
	}

	if (track.kind === 'audio') {
		this._audioTracks[track.id] = track;
	} else if (track.kind === 'video') {
		this._videoTracks[track.id] = track;
	} else {
		throw new Error('unknown kind attribute: ' + track.kind);
	}

	addListenerForTrackEnded.call(this, track);

	exec(null, null, 'iosrtcPlugin', 'MediaStream_addTrack', [this.id, track.id]);
};


MediaStream.prototype.removeTrack = function (track) {
	debug('removeTrack() [track:%o]', track);

	if (!(track instanceof MediaStreamTrack)) {
		throw new Error('argument must be an instance of MediaStreamTrack');
	}

	if (!this._audioTracks[track.id] && !this._videoTracks[track.id]) {
		return;
	}

	if (track.kind === 'audio') {
		delete this._audioTracks[track.id];
	} else if (track.kind === 'video') {
		delete this._videoTracks[track.id];
	} else {
		throw new Error('unknown kind attribute: ' + track.kind);
	}

	exec(null, null, 'iosrtcPlugin', 'MediaStream_removeTrack', [this.id, track.id]);

	checkActive.call(this);
};


// Backwards compatible API.
MediaStream.prototype.stop = function () {
	debug('stop()');

	var trackId;

	for (trackId in this._audioTracks) {
		if (this._audioTracks.hasOwnProperty(trackId)) {
			this._audioTracks[trackId].stop();
		}
	}

	for (trackId in this._videoTracks) {
		if (this._videoTracks.hasOwnProperty(trackId)) {
			this._videoTracks[trackId].stop();
		}
	}
};


// TODO: API methods and events.


/**
 * Private API.
 */


MediaStream.prototype.emitConnected = function () {
	debug('emitConnected()');

	var self = this;

	if (this.connected) {
		return;
	}
	this.connected = true;

	setTimeout(function () {
		self.dispatchEvent(new Event('connected'));
	});
};


function addListenerForTrackEnded(track) {
	var self = this;

	track.addEventListener('ended', function () {
		if (track.kind === 'audio' && !self._audioTracks[track.id]) {
			return;
		} else if (track.kind === 'video' && !self._videoTracks[track.id]) {
			return;
		}

		checkActive.call(self);
	});
}


function checkActive() {
	// A MediaStream object is said to be active when it has at least one MediaStreamTrack
	// that has not ended. A MediaStream that does not have any tracks or only has tracks
	// that are ended is inactive.

	var self = this,
		trackId;

	if (!this.active) {
		return;
	}

	if (Object.keys(this._audioTracks).length === 0 && Object.keys(this._videoTracks).length === 0) {
		debug('no tracks, releasing MediaStream');

		release();
		return;
	}

	for (trackId in this._audioTracks) {
		if (this._audioTracks.hasOwnProperty(trackId)) {
			if (this._audioTracks[trackId].readyState !== 'ended') {
				return;
			}
		}
	}

	for (trackId in this._videoTracks) {
		if (this._videoTracks.hasOwnProperty(trackId)) {
			if (this._videoTracks[trackId].readyState !== 'ended') {
				return;
			}
		}
	}

	debug('all tracks are ended, releasing MediaStream');
	release();

	function release() {
		self.active = false;
		self.dispatchEvent(new Event('inactive'));

		// Remove the stream from the dictionary.
		delete mediaStreams[self._blobId];

		exec(null, null, 'iosrtcPlugin', 'MediaStream_release', [self.id]);
	}
}


function onEvent(data) {
	var type = data.type,
		event,
		track;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'addtrack':
			track = new MediaStreamTrack(data.track);

			if (track.kind === 'audio') {
				this._audioTracks[track.id] = track;
			} else if (track.kind === 'video') {
				this._videoTracks[track.id] = track;
			}
			addListenerForTrackEnded.call(this, track);

			event = new Event('addtrack');
			event.track = track;

			this.dispatchEvent(event);

			// Also emit 'update' for the MediaStreamRenderer.
			this.dispatchEvent(new Event('update'));
			break;

		case 'removetrack':
			if (data.track.kind === 'audio') {
				track = this._audioTracks[data.track.id];
				delete this._audioTracks[data.track.id];
			} else if (data.track.kind === 'video') {
				track = this._videoTracks[data.track.id];
				delete this._videoTracks[data.track.id];
			}

			if (!track) {
				throw new Error('"removetrack" event fired on MediaStream for a non existing MediaStreamTrack');
			}

			event = new Event('removetrack');
			event.track = track;

			this.dispatchEvent(event);
			// Also emit 'update' for the MediaStreamRenderer.
			this.dispatchEvent(new Event('update'));

			// Check whether the MediaStream still is active.
			checkActive.call(this);
			break;
	}
}

},{"./MediaStreamTrack":5,"cordova/exec":undefined,"debug":17,"yaeti":23}],4:[function(_dereq_,module,exports){
/**
 * Expose the MediaStreamRenderer class.
 */
module.exports = MediaStreamRenderer;


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:MediaStreamRenderer'),
	exec = _dereq_('cordova/exec'),
	randomNumber = _dereq_('random-number').generator({min: 10000, max: 99999, integer: true}),
	EventTarget = _dereq_('yaeti').EventTarget,
	MediaStream = _dereq_('./MediaStream');


function MediaStreamRenderer(element) {
	debug('new() | [element:"%s"]', element);

	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	if (!(element instanceof HTMLElement)) {
		throw new Error('a valid HTMLElement is required');
	}

	// Public atributes.
	this.element = element;
	this.stream = undefined;
	this.videoWidth = undefined;
	this.videoHeight = undefined;

	// Private attributes.
	this.id = randomNumber();

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'new_MediaStreamRenderer', [this.id]);

	this.refresh(this);
}


MediaStreamRenderer.prototype.render = function (stream) {
	debug('render() [stream:%o]', stream);

	var self = this;

	if (!(stream instanceof MediaStream)) {
		throw new Error('render() requires a MediaStream instance as argument');
	}

	this.stream = stream;

	exec(null, null, 'iosrtcPlugin', 'MediaStreamRenderer_render', [this.id, stream.id]);

	// Subscribe to 'update' event so we call native mediaStreamChanged() on it.
	stream.addEventListener('update', function () {
		if (self.stream !== stream) {
			return;
		}

		debug('MediaStream emits "update", calling native mediaStreamChanged()');

		exec(null, null, 'iosrtcPlugin', 'MediaStreamRenderer_mediaStreamChanged', [self.id]);
	});

	// Subscribe to 'inactive' event and emit "close" so the video element can react.
	stream.addEventListener('inactive', function () {
		if (self.stream !== stream) {
			return;
		}

		debug('MediaStream emits "inactive", emiting "close" and closing this MediaStreamRenderer');

		self.dispatchEvent(new Event('close'));
		self.close();
	});

	if (stream.connected) {
		connected();
	// Otherwise subscribe to 'connected' event to emulate video elements events.
	} else {
		stream.addEventListener('connected', function () {
			if (self.stream !== stream) {
				return;
			}

			connected();
		});
	}

	function connected() {
		// Emit video events.
		self.element.dispatchEvent(new Event('loadedmetadata'));
		self.element.dispatchEvent(new Event('loadeddata'));
		self.element.dispatchEvent(new Event('canplay'));
		self.element.dispatchEvent(new Event('canplaythrough'));
	}
};


MediaStreamRenderer.prototype.refresh = function () {
	debug('refresh()');

	var elementPositionAndSize = getElementPositionAndSize.call(this),
		computedStyle,
		videoRatio,
		elementRatio,
		elementLeft = elementPositionAndSize.left,
		elementTop = elementPositionAndSize.top,
		elementWidth = elementPositionAndSize.width,
		elementHeight = elementPositionAndSize.height,
		videoViewWidth,
		videoViewHeight,
		visible,
		opacity,
		zIndex,
		mirrored,
		objectFit,
		clip,
		borderRadius,
		paddingTop,
		paddingBottom,
		paddingLeft,
		paddingRight;

	computedStyle = window.getComputedStyle(this.element);

	// get padding values
	paddingTop = parseInt(computedStyle.paddingTop) | 0;
	paddingBottom = parseInt(computedStyle.paddingBottom) | 0;
	paddingLeft = parseInt(computedStyle.paddingLeft) | 0;
	paddingRight = parseInt(computedStyle.paddingRight) | 0;

	// fix position according to padding
	elementLeft += paddingLeft;
	elementTop += paddingTop;

	// fix width and height according to padding
	elementWidth -= (paddingLeft + paddingRight);
	elementHeight -= (paddingTop + paddingBottom);

	videoViewWidth = elementWidth;
	videoViewHeight = elementHeight;

	// visible
	if (computedStyle.visibility === 'hidden') {
		visible = false;
	} else {
		visible = !!this.element.offsetHeight;  // Returns 0 if element or any parent is hidden.
	}

	// opacity
	opacity = parseFloat(computedStyle.opacity);

	// zIndex
	zIndex = parseFloat(computedStyle.zIndex) || parseFloat(this.element.style.zIndex) || 0;

	// mirrored (detect "-webkit-transform: scaleX(-1);" or equivalent)
	if (computedStyle.transform === 'matrix(-1, 0, 0, 1, 0, 0)' ||
		computedStyle['-webkit-transform'] === 'matrix(-1, 0, 0, 1, 0, 0)') {
		mirrored = true;
	} else {
		mirrored = false;
	}

	// objectFit ('contain' is set as default value)
	objectFit = computedStyle.objectFit || 'contain';

	// clip
	if (objectFit === 'none') {
		clip = false;
	} else {
		clip = true;
	}

	// borderRadius
	borderRadius = parseFloat(computedStyle.borderRadius);
	if (/%$/.test(borderRadius)) {
		borderRadius = Math.min(elementHeight, elementWidth) * borderRadius;
	}

	/**
	 * No video yet, so just update the UIView with the element settings.
	 */

	if (!this.videoWidth || !this.videoHeight) {
		debug('refresh() | no video track yet');

		nativeRefresh.call(this);
		return;
	}

	videoRatio = this.videoWidth / this.videoHeight;

	/**
	 * Element has no width and/or no height.
	 */

	if (!elementWidth || !elementHeight) {
		debug('refresh() | video element has 0 width and/or 0 height');

		nativeRefresh.call(this);
		return;
	}

	/**
	 * Set video view position and size.
	 */

	elementRatio = elementWidth / elementHeight;

	switch (objectFit) {
		case 'cover':
			// The element has higher or equal width/height ratio than the video.
			if (elementRatio >= videoRatio) {
				videoViewWidth = elementWidth;
				videoViewHeight = videoViewWidth / videoRatio;
			// The element has lower width/height ratio than the video.
			} else if (elementRatio < videoRatio) {
				videoViewHeight = elementHeight;
				videoViewWidth = videoViewHeight * videoRatio;
			}
			break;

		case 'fill':
			videoViewHeight = elementHeight;
			videoViewWidth = elementWidth;
			break;

		case 'none':
			videoViewHeight = this.videoHeight;
			videoViewWidth = this.videoWidth;
			break;

		case 'scale-down':
			// Same as 'none'.
			if (this.videoWidth <= elementWidth && this.videoHeight <= elementHeight) {
				videoViewHeight = this.videoHeight;
				videoViewWidth = this.videoWidth;
			// Same as 'contain'.
			} else {
				// The element has higher or equal width/height ratio than the video.
				if (elementRatio >= videoRatio) {
					videoViewHeight = elementHeight;
					videoViewWidth = videoViewHeight * videoRatio;
				// The element has lower width/height ratio than the video.
				} else if (elementRatio < videoRatio) {
					videoViewWidth = elementWidth;
					videoViewHeight = videoViewWidth / videoRatio;
				}
			}
			break;

		// 'contain'.
		default:
			objectFit = 'contain';
			// The element has higher or equal width/height ratio than the video.
			if (elementRatio >= videoRatio) {
				videoViewHeight = elementHeight;
				videoViewWidth = videoViewHeight * videoRatio;
			// The element has lower width/height ratio than the video.
			} else if (elementRatio < videoRatio) {
				videoViewWidth = elementWidth;
				videoViewHeight = videoViewWidth / videoRatio;
			}
			break;
	}

	nativeRefresh.call(this);

	function nativeRefresh() {
		var data = {
			elementLeft: elementLeft,
			elementTop: elementTop,
			elementWidth: elementWidth,
			elementHeight: elementHeight,
			videoViewWidth: videoViewWidth,
			videoViewHeight: videoViewHeight,
			visible: visible,
			opacity: opacity,
			zIndex: zIndex,
			mirrored: mirrored,
			objectFit: objectFit,
			clip: clip,
			borderRadius: borderRadius
		};

		debug('refresh() | [data:%o]', data);

		exec(null, null, 'iosrtcPlugin', 'MediaStreamRenderer_refresh', [this.id, data]);
	}
};


MediaStreamRenderer.prototype.close = function () {
	debug('close()');

	if (!this.stream) {
		return;
	}
	this.stream = undefined;

	exec(null, null, 'iosrtcPlugin', 'MediaStreamRenderer_close', [this.id]);
};


/**
 * Private API.
 */


function onEvent(data) {
	var type = data.type,
		event;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'videoresize':
			this.videoWidth = data.size.width;
			this.videoHeight = data.size.height;
			this.refresh(this);

			event = new Event(type);
			event.videoWidth = data.size.width;
			event.videoHeight = data.size.height;
			this.dispatchEvent(event);

			break;
	}
}


function getElementPositionAndSize() {
	var rect = this.element.getBoundingClientRect();

	return {
		left:   rect.left + this.element.clientLeft,
		top:    rect.top + this.element.clientTop,
		width:  this.element.clientWidth,
		height: this.element.clientHeight
	};
}

},{"./MediaStream":3,"cordova/exec":undefined,"debug":17,"random-number":22,"yaeti":23}],5:[function(_dereq_,module,exports){
/**
 * Expose the MediaStreamTrack class.
 */
module.exports = MediaStreamTrack;


/**
 * Spec: http://w3c.github.io/mediacapture-main/#mediastreamtrack
 */


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:MediaStreamTrack'),
	exec = _dereq_('cordova/exec'),
	enumerateDevices = _dereq_('./enumerateDevices'),
	EventTarget = _dereq_('yaeti').EventTarget;


function MediaStreamTrack(dataFromEvent) {
	debug('new() | [dataFromEvent:%o]', dataFromEvent);

	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	// Public atributes.
	this.id = dataFromEvent.id;  // NOTE: It's a string.
	this.kind = dataFromEvent.kind;
	this.label = dataFromEvent.label;
	this.muted = false;  // TODO: No "muted" property in ObjC API.
	this.readyState = dataFromEvent.readyState;

	// Private attributes.
	this._enabled = dataFromEvent.enabled;
	this._ended = false;

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'MediaStreamTrack_setListener', [this.id]);
}


// Setters.
Object.defineProperty(MediaStreamTrack.prototype, 'enabled', {
	get: function () {
		return this._enabled;
	},
	set: function (value) {
		debug('enabled = %s', !!value);

		this._enabled = !!value;
		exec(null, null, 'iosrtcPlugin', 'MediaStreamTrack_setEnabled', [this.id, this._enabled]);
	}
});


MediaStreamTrack.prototype.stop = function () {
	debug('stop()');

	if (this._ended) {
		return;
	}

	exec(null, null, 'iosrtcPlugin', 'MediaStreamTrack_stop', [this.id]);
};


// TODO: API methods and events.


/**
 * Class methods.
 */


MediaStreamTrack.getSources = function () {
	debug('getSources()');

	return enumerateDevices.apply(this, arguments);
};


/**
 * Private API.
 */


function onEvent(data) {
	var type = data.type;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'statechange':
			this.readyState = data.readyState;
			this._enabled = data.enabled;

			switch (data.readyState) {
				case 'initializing':
					break;
				case 'live':
					break;
				case 'ended':
					this._ended = true;
					this.dispatchEvent(new Event('ended'));
					break;
				case 'failed':
					break;
			}
			break;
	}
}

},{"./enumerateDevices":13,"cordova/exec":undefined,"debug":17,"yaeti":23}],6:[function(_dereq_,module,exports){
/**
 * Expose the RTCDTMFSender class.
 */
module.exports = RTCDTMFSender;


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:RTCDTMFSender'),
	debugerror = _dereq_('debug')('iosrtc:ERROR:RTCDTMFSender'),
	exec = _dereq_('cordova/exec'),
	randomNumber = _dereq_('random-number').generator({min: 10000, max: 99999, integer: true}),
	EventTarget = _dereq_('yaeti').EventTarget;


debugerror.log = console.warn.bind(console);


function RTCDTMFSender(peerConnection, track) {
	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	debug('new() | [track:%o]', track);

	// Public atributes (accessed as read-only properties)
	this._track = track;
	// TODO: read these from the properties exposed in Swift?
	this._duration = 100;
	this._interToneGap = 70;
	this._toneBuffer = '';

	// Private attributes.
	this.peerConnection = peerConnection;
	this.dsId = randomNumber();

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_createDTMFSender', [this.peerConnection.pcId, this.dsId, this._track.id]);

}


Object.defineProperty(RTCDTMFSender.prototype, 'canInsertDTMF', {
	get: function () {
		// TODO: check if it's muted or stopped?
		return this._track && this._track.kind === 'audio' && this._track.enabled;
	}
});


Object.defineProperty(RTCDTMFSender.prototype, 'track', {
	get: function () {
		return this._track;
	}
});


Object.defineProperty(RTCDTMFSender.prototype, 'duration', {
	get: function () {
		return this._duration;
	}
});


Object.defineProperty(RTCDTMFSender.prototype, 'interToneGap', {
	get: function () {
		return this._interToneGap;
	}
});


Object.defineProperty(RTCDTMFSender.prototype, 'toneBuffer', {
	get: function () {
		return this._toneBuffer;
	}
});


RTCDTMFSender.prototype.insertDTMF = function (tones, duration, interToneGap) {
	if (isClosed.call(this)) {
		return;
	}

	debug('insertDTMF() | [tones:%o, duration:%o, interToneGap:%o]', tones, duration, interToneGap);

	if (!tones) {
		return;
	}

	this._duration = duration || 100;
	this._interToneGap = interToneGap || 70;

	var self = this;

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDTMFSender_insertDTMF', [this.peerConnection.pcId, this.dsId, tones, this._duration, this._interToneGap]);
};


/**
 * Private API.
 */


function isClosed() {
	return this.peerConnection.signalingState === 'closed';
}


function onEvent(data) {
	var type = data.type,
		event;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	if (type === 'tonechange') {
		event = new Event('tonechange');
		event.tone = data.tone;
		this.dispatchEvent(event);
	}
}

},{"cordova/exec":undefined,"debug":17,"random-number":22,"yaeti":23}],7:[function(_dereq_,module,exports){
/**
 * Expose the RTCDataChannel class.
 */
module.exports = RTCDataChannel;


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:RTCDataChannel'),
	debugerror = _dereq_('debug')('iosrtc:ERROR:RTCDataChannel'),
	exec = _dereq_('cordova/exec'),
	randomNumber = _dereq_('random-number').generator({min: 10000, max: 99999, integer: true}),
	EventTarget = _dereq_('yaeti').EventTarget;


debugerror.log = console.warn.bind(console);


function RTCDataChannel(peerConnection, label, options, dataFromEvent) {
	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	// Created via pc.createDataChannel().
	if (!dataFromEvent) {
		debug('new() | [label:%o, options:%o]', label, options);

		if (typeof label !== 'string') {
			label = '';
		}

		options = options || {};

		if (options.hasOwnProperty('maxPacketLifeTime') && options.hasOwnProperty('maxRetransmits')) {
			throw new SyntaxError('both maxPacketLifeTime and maxRetransmits can not be present');
		}

		if (options.hasOwnProperty('id')) {
			if (typeof options.id !== 'number' || isNaN(options.id) || options.id < 0) {
				throw new SyntaxError('id must be a number');
			}
			// TODO:
			//   https://code.google.com/p/webrtc/issues/detail?id=4618
			if (options.id > 1023) {
				throw new SyntaxError('id cannot be greater than 1023 (https://code.google.com/p/webrtc/issues/detail?id=4614)');
			}
		}

		// Public atributes.
		this.label = label;
		this.ordered = options.hasOwnProperty('ordered') ? !!options.ordered : true;
		this.maxPacketLifeTime = options.hasOwnProperty('maxPacketLifeTime') ? Number(options.maxPacketLifeTime) : null;
		this.maxRetransmits = options.hasOwnProperty('maxRetransmits') ? Number(options.maxRetransmits) : null;
		this.protocol = options.hasOwnProperty('protocol') ? String(options.protocol) : '';
		this.negotiated = options.hasOwnProperty('negotiated') ? !!options.negotiated : false;
		this.id = options.hasOwnProperty('id') ? Number(options.id) : undefined;
		this.readyState = 'connecting';
		this.bufferedAmount = 0;
		this.bufferedAmountLowThreshold = 0;

		// Private attributes.
		this.peerConnection = peerConnection;
		this.dcId = randomNumber();

		exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_createDataChannel', [this.peerConnection.pcId, this.dcId, label, options]);
	// Created via pc.ondatachannel.
	} else {
		debug('new() | [dataFromEvent:%o]', dataFromEvent);

		// Public atributes.
		this.label = dataFromEvent.label;
		this.ordered = dataFromEvent.ordered;
		this.maxPacketLifeTime = dataFromEvent.maxPacketLifeTime;
		this.maxRetransmits = dataFromEvent.maxRetransmits;
		this.protocol = dataFromEvent.protocol;
		this.negotiated = dataFromEvent.negotiated;
		this.id = dataFromEvent.id;
		this.readyState = dataFromEvent.readyState;
		this.bufferedAmount = dataFromEvent.bufferedAmount;
		this.bufferedAmountLowThreshold = dataFromEvent.bufferedAmountLowThreshold;

		// Private attributes.
		this.peerConnection = peerConnection;
		this.dcId = dataFromEvent.dcId;

		exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_setListener', [this.peerConnection.pcId, this.dcId]);
	}

	function onResultOK(data) {
		if (data.type) {
			onEvent.call(self, data);
		// Special handler for received binary mesage.
		} else {
			onEvent.call(self, {
				type: 'message',
				message: data
			});
		}
	}
}


// Just 'arraybuffer' binaryType is implemented in Chromium.
Object.defineProperty(RTCDataChannel.prototype, 'binaryType', {
	get: function () {
		return 'arraybuffer';
	},
	set: function (type) {
		if (type !== 'arraybuffer') {
			throw new Error('just "arraybuffer" is implemented for binaryType');
		}
	}
});


RTCDataChannel.prototype.send = function (data) {
	if (isClosed.call(this) || this.readyState !== 'open') {
		return;
	}

	debug('send() | [data:%o]', data);

	if (!data) {
		return;
	}

	if (typeof data === 'string' || data instanceof String) {
		exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_sendString', [this.peerConnection.pcId, this.dcId, data]);
	} else if (window.ArrayBuffer && data instanceof window.ArrayBuffer) {
		exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_sendBinary', [this.peerConnection.pcId, this.dcId, data]);
	} else if (
		(window.Int8Array && data instanceof window.Int8Array) ||
		(window.Uint8Array && data instanceof window.Uint8Array) ||
		(window.Uint8ClampedArray && data instanceof window.Uint8ClampedArray) ||
		(window.Int16Array && data instanceof window.Int16Array) ||
		(window.Uint16Array && data instanceof window.Uint16Array) ||
		(window.Int32Array && data instanceof window.Int32Array) ||
		(window.Uint32Array && data instanceof window.Uint32Array) ||
		(window.Float32Array && data instanceof window.Float32Array) ||
		(window.Float64Array && data instanceof window.Float64Array) ||
		(window.DataView && data instanceof window.DataView)
	) {
		exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_sendBinary', [this.peerConnection.pcId, this.dcId, data.buffer]);
	} else {
		throw new Error('invalid data type');
	}
};


RTCDataChannel.prototype.close = function () {
	if (isClosed.call(this)) {
		return;
	}

	debug('close()');

	this.readyState = 'closing';

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_close', [this.peerConnection.pcId, this.dcId]);
};


/**
 * Private API.
 */


function isClosed() {
	return this.readyState === 'closed' || this.readyState === 'closing' || this.peerConnection.signalingState === 'closed';
}


function onEvent(data) {
	var type = data.type,
		event;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'new':
			// Update properties and exit without firing the event.
			this.ordered = data.channel.ordered;
			this.maxPacketLifeTime = data.channel.maxPacketLifeTime;
			this.maxRetransmits = data.channel.maxRetransmits;
			this.protocol = data.channel.protocol;
			this.negotiated = data.channel.negotiated;
			this.id = data.channel.id;
			this.readyState = data.channel.readyState;
			this.bufferedAmount = data.channel.bufferedAmount;
			break;

		case 'statechange':
			this.readyState = data.readyState;

			switch (data.readyState) {
				case 'connecting':
					break;
				case 'open':
					this.dispatchEvent(new Event('open'));
					break;
				case 'closing':
					break;
				case 'closed':
					this.dispatchEvent(new Event('close'));
					break;
			}
			break;

		case 'message':
			event = new Event('message');
			event.data = data.message;
			this.dispatchEvent(event);
			break;

		case 'bufferedamount':
			this.bufferedAmount = data.bufferedAmount;

			if (this.bufferedAmountLowThreshold > 0 && this.bufferedAmountLowThreshold > this.bufferedAmount) {
				event = new Event('bufferedamountlow');
				event.bufferedAmount = this.bufferedAmount;
				this.dispatchEvent(event);
			}

			break;
	}
}

},{"cordova/exec":undefined,"debug":17,"random-number":22,"yaeti":23}],8:[function(_dereq_,module,exports){
/**
 * Expose the RTCIceCandidate class.
 */
module.exports = RTCIceCandidate;


function RTCIceCandidate(data) {
	data = data || {};

	// Public atributes.
	this.sdpMid = data.sdpMid;
	this.sdpMLineIndex = data.sdpMLineIndex;
	this.candidate = data.candidate;
}

},{}],9:[function(_dereq_,module,exports){
(function (global){
/**
 * Expose the RTCPeerConnection class.
 */
module.exports = RTCPeerConnection;


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:RTCPeerConnection'),
	debugerror = _dereq_('debug')('iosrtc:ERROR:RTCPeerConnection'),
	exec = _dereq_('cordova/exec'),
	randomNumber = _dereq_('random-number').generator({min: 10000, max: 99999, integer: true}),
	EventTarget = _dereq_('yaeti').EventTarget,
	RTCSessionDescription = _dereq_('./RTCSessionDescription'),
	RTCIceCandidate = _dereq_('./RTCIceCandidate'),
	RTCDataChannel = _dereq_('./RTCDataChannel'),
	RTCDTMFSender = _dereq_('./RTCDTMFSender'),
	RTCStatsResponse = _dereq_('./RTCStatsResponse'),
	RTCStatsReport = _dereq_('./RTCStatsReport'),
	MediaStream = _dereq_('./MediaStream'),
	MediaStreamTrack = _dereq_('./MediaStreamTrack'),
	Errors = _dereq_('./Errors');


debugerror.log = console.warn.bind(console);


function RTCPeerConnection(pcConfig, pcConstraints) {
	debug('new() | [pcConfig:%o, pcConstraints:%o]', pcConfig, pcConstraints);

	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	// Public atributes.
	this.localDescription = null;
	this.remoteDescription = null;
	this.signalingState = 'stable';
	this.iceGatheringState = 'new';
	this.iceConnectionState = 'new';
	this.pcConfig = fixPcConfig(pcConfig);

	// Private attributes.
	this.pcId = randomNumber();
	this.localStreams = {};
	this.remoteStreams = {};

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'new_RTCPeerConnection', [this.pcId, this.pcConfig, pcConstraints]);
}


RTCPeerConnection.prototype.createOffer = function () {
	var self = this,
		isPromise,
		options,
		callback, errback;

	if (typeof arguments[0] !== 'function') {
		isPromise = true;
		options = arguments[0];
	} else {
		isPromise = false;
		callback = arguments[0];
		errback = arguments[1];
		options = arguments[2];
	}

	if (isClosed.call(this)) {
		return;
	}

	debug('createOffer() [options:%o]', options);

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				var desc = new RTCSessionDescription(data);

				debug('createOffer() | success [desc:%o]', desc);
				resolve(desc);
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('createOffer() | failure: %s', error);
				reject(new global.DOMError(error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createOffer', [self.pcId, options]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		var desc = new RTCSessionDescription(data);

		debug('createOffer() | success [desc:%o]', desc);
		callback(desc);
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('createOffer() | failure: %s', error);
		if (typeof errback === 'function') {
			errback(new global.DOMError(error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createOffer', [this.pcId, options]);
};


RTCPeerConnection.prototype.createAnswer = function () {
	var self = this,
		isPromise,
		options,
		callback, errback;

	if (typeof arguments[0] !== 'function') {
		isPromise = true;
		options = arguments[0];
	} else {
		isPromise = false;
		callback = arguments[0];
		errback = arguments[1];
		options = arguments[2];
	}

	if (isClosed.call(this)) {
		return;
	}

	debug('createAnswer() [options:%o]', options);

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				var desc = new RTCSessionDescription(data);

				debug('createAnswer() | success [desc:%o]', desc);
				resolve(desc);
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('createAnswer() | failure: %s', error);
				reject(new global.DOMError(error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createAnswer', [self.pcId, options]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		var desc = new RTCSessionDescription(data);

		debug('createAnswer() | success [desc:%o]', desc);
		callback(desc);
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('createAnswer() | failure: %s', error);
		if (typeof errback === 'function') {
			errback(new global.DOMError(error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createAnswer', [this.pcId, options]);
};



RTCPeerConnection.prototype.setLocalDescription = function (desc) {
	var self = this,
		isPromise,
		callback, errback;

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (isClosed.call(this)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidStateError('peerconnection is closed'));
			});
		} else {
			throw new Errors.InvalidStateError('peerconnection is closed');
		}
	}

	debug('setLocalDescription() [desc:%o]', desc);

	if (!(desc instanceof RTCSessionDescription)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidSessionDescriptionError('setLocalDescription() must be called with a RTCSessionDescription instance as first argument'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new Errors.InvalidSessionDescriptionError('setLocalDescription() must be called with a RTCSessionDescription instance as first argument'));
			}
			return;
		}
	}

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				debug('setLocalDescription() | success');
				// Update localDescription.
				self.localDescription = new RTCSessionDescription(data);
				resolve();
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('setLocalDescription() | failure: %s', error);
				reject(new Errors.InvalidSessionDescriptionError('setLocalDescription() failed: ' + error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setLocalDescription', [self.pcId, desc]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		debug('setLocalDescription() | success');
		// Update localDescription.
		self.localDescription = new RTCSessionDescription(data);
		callback();
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('setLocalDescription() | failure: %s', error);

		if (typeof errback === 'function') {
			errback(new Errors.InvalidSessionDescriptionError('setLocalDescription() failed: ' + error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setLocalDescription', [this.pcId, desc]);
};


RTCPeerConnection.prototype.setRemoteDescription = function (desc) {
	var self = this,
		isPromise,
		callback, errback;

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (isClosed.call(this)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidStateError('peerconnection is closed'));
			});
		} else {
			throw new Errors.InvalidStateError('peerconnection is closed');
		}
	}

	debug('setRemoteDescription() [desc:%o]', desc);

	if (!(desc instanceof RTCSessionDescription)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidSessionDescriptionError('setRemoteDescription() must be called with a RTCSessionDescription instance as first argument'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new Errors.InvalidSessionDescriptionError('setRemoteDescription() must be called with a RTCSessionDescription instance as first argument'));
			}
			return;
		}
	}

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				debug('setRemoteDescription() | success');
				// Update remoteDescription.
				self.remoteDescription = new RTCSessionDescription(data);
				resolve();
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('setRemoteDescription() | failure: %s', error);
				reject(new Errors.InvalidSessionDescriptionError('setRemoteDescription() failed: ' + error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setRemoteDescription', [self.pcId, desc]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		debug('setRemoteDescription() | success');
		// Update remoteDescription.
		self.remoteDescription = new RTCSessionDescription(data);
		callback();
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('setRemoteDescription() | failure: %s', error);

		if (typeof errback === 'function') {
			errback(new Errors.InvalidSessionDescriptionError('setRemoteDescription() failed: ' + error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setRemoteDescription', [this.pcId, desc]);
};



RTCPeerConnection.prototype.addIceCandidate = function (candidate) {
	var self = this,
		isPromise,
		callback, errback;

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (isClosed.call(this)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidStateError('peerconnection is closed'));
			});
		} else {
			throw new Errors.InvalidStateError('peerconnection is closed');
		}
	}

	debug('addIceCandidate() | [candidate:%o]', candidate);

	if (typeof candidate !== 'object') {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new global.DOMError('addIceCandidate() must be called with a RTCIceCandidate instance or RTCIceCandidateInit object as argument'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new global.DOMError('addIceCandidate() must be called with a RTCIceCandidate instance or RTCIceCandidateInit object as argument'));
			}
			return;
		}
	}

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				debug('addIceCandidate() | success');
				// Update remoteDescription.
				if (self.remoteDescription && data.remoteDescription) {
					self.remoteDescription.type = data.remoteDescription.type;
					self.remoteDescription.sdp = data.remoteDescription.sdp;
				} else if (data.remoteDescription) {
					self.remoteDescription = new RTCSessionDescription(data.remoteDescription);
				}
				resolve();
			}

			function onResultError() {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('addIceCandidate() | failure');
				reject(new global.DOMError('addIceCandidate() failed'));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_addIceCandidate', [self.pcId, candidate]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		debug('addIceCandidate() | success');
		// Update remoteDescription.
		if (self.remoteDescription && data.remoteDescription) {
			self.remoteDescription.type = data.remoteDescription.type;
			self.remoteDescription.sdp = data.remoteDescription.sdp;
		} else if (data.remoteDescription) {
			self.remoteDescription = new RTCSessionDescription(data.remoteDescription);
		}
		callback();
	}

	function onResultError() {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('addIceCandidate() | failure');
		if (typeof errback === 'function') {
			errback(new global.DOMError('addIceCandidate() failed'));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_addIceCandidate', [this.pcId, candidate]);
};


RTCPeerConnection.prototype.getConfiguration = function () {
	debug('getConfiguration()');

	return this.pcConfig;
};


RTCPeerConnection.prototype.getLocalStreams = function () {
	debug('getLocalStreams()');

	var streams = [],
		id;

	for (id in this.localStreams) {
		if (this.localStreams.hasOwnProperty(id)) {
			streams.push(this.localStreams[id]);
		}
	}

	return streams;
};


RTCPeerConnection.prototype.getRemoteStreams = function () {
	debug('getRemoteStreams()');

	var streams = [],
		id;

	for (id in this.remoteStreams) {
		if (this.remoteStreams.hasOwnProperty(id)) {
			streams.push(this.remoteStreams[id]);
		}
	}

	return streams;
};


RTCPeerConnection.prototype.getStreamById = function (id) {
	debug('getStreamById()');

	return this.localStreams[id] || this.remoteStreams[id] || null;
};


RTCPeerConnection.prototype.addStream = function (stream) {
	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('addStream()');

	if (!(stream instanceof MediaStream)) {
		throw new Error('addStream() must be called with a MediaStream instance as argument');
	}

	if (this.localStreams[stream.id]) {
		debugerror('addStream() | given stream already in present in local streams');
		return;
	}

	this.localStreams[stream.id] = stream;

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_addStream', [this.pcId, stream.id]);
};


RTCPeerConnection.prototype.removeStream = function (stream) {
	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('removeStream()');

	if (!(stream instanceof MediaStream)) {
		throw new Error('removeStream() must be called with a MediaStream instance as argument');
	}

	if (!this.localStreams[stream.id]) {
		debugerror('removeStream() | given stream not present in local streams');
		return;
	}

	delete this.localStreams[stream.id];

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_removeStream', [this.pcId, stream.id]);
};


RTCPeerConnection.prototype.createDataChannel = function (label, options) {
	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('createDataChannel() [label:%s, options:%o]', label, options);

	return new RTCDataChannel(this, label, options);
};


RTCPeerConnection.prototype.createDTMFSender = function (track) {
	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('createDTMFSender() [track:%o]', track);

	return new RTCDTMFSender(this, track);
};

RTCPeerConnection.prototype.getStats = function () {
	var self = this,
		isPromise,
		selector,
		callback, errback;

	if (typeof arguments[0] !== 'function') {
		isPromise = true;
		selector = arguments[0];
	} else {
		isPromise = false;
		callback = arguments[0];
		selector = arguments[1];
		errback = arguments[2];
	}

	if (selector && !(selector instanceof MediaStreamTrack)) {
		throw new Error('getStats() must be called with null or a valid MediaStreamTrack instance as argument');
	}

	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('getStats() [selector:%o]', selector);

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(array) {
				if (isClosed.call(self)) {
					return;
				}

				var res = [];
				array.forEach(function (stat) {
					res.push(new RTCStatsReport(stat));
				});
				resolve(new RTCStatsResponse(res));
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('getStats() | failure: %s', error);
				reject(new global.DOMError(error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_getStats', [self.pcId, selector ? selector.id : null]);
		});
	}

	function onResultOK(array) {
		if (isClosed.call(self)) {
			return;
		}

		var res = [];
		array.forEach(function (stat) {
			res.push(new RTCStatsReport(stat));
		});
		callback(new RTCStatsResponse(res));
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('getStats() | failure: %s', error);
		if (typeof errback === 'function') {
			errback(new global.DOMError(error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_getStats', [this.pcId, selector ? selector.id : null]);
};

RTCPeerConnection.prototype.close = function () {
	if (isClosed.call(this)) {
		return;
	}

	debug('close()');

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_close', [this.pcId]);
};


/**
 * Private API.
 */


function fixPcConfig(pcConfig) {
	if (!pcConfig) {
		return {
			iceServers: []
		};
	}

	var iceServers = pcConfig.iceServers,
		i, len, iceServer;

	if (!Array.isArray(iceServers)) {
		pcConfig.iceServers = [];
		return pcConfig;
	}

	for (i = 0, len = iceServers.length; i < len; i++) {
		iceServer = iceServers[i];

		// THe Objective-C wrapper of WebRTC is old and does not implement .urls.
		if (iceServer.url) {
			continue;
		} else if (Array.isArray(iceServer.urls)) {
			iceServer.url = iceServer.urls[0];
		} else if (typeof iceServer.urls === 'string') {
			iceServer.url = iceServer.urls;
		}
	}

	return pcConfig;
}


function isClosed() {
	return this.signalingState === 'closed';
}


function onEvent(data) {
	var type = data.type,
		event = new Event(type),
		stream,
		dataChannel,
		id;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'signalingstatechange':
			this.signalingState = data.signalingState;
			break;

		case 'icegatheringstatechange':
			this.iceGatheringState = data.iceGatheringState;
			break;

		case 'iceconnectionstatechange':
			this.iceConnectionState = data.iceConnectionState;

			// Emit "connected" on remote streams if ICE connected.
			if (data.iceConnectionState === 'connected') {
				for (id in this.remoteStreams) {
					if (this.remoteStreams.hasOwnProperty(id)) {
						this.remoteStreams[id].emitConnected();
					}
				}
			}
			break;

		case 'icecandidate':
			if (data.candidate) {
				event.candidate = new RTCIceCandidate(data.candidate);
			} else {
				event.candidate = null;
			}
			// Update localDescription.
			if (this.localDescription) {
				this.localDescription.type = data.localDescription.type;
				this.localDescription.sdp = data.localDescription.sdp;
			} else {
				this.localDescription = new RTCSessionDescription(data);
			}
			break;

		case 'negotiationneeded':
			break;

		case 'addstream':
			stream = MediaStream.create(data.stream);
			event.stream = stream;

			// Append to the remote streams.
			this.remoteStreams[stream.id] = stream;

			// Emit "connected" on the stream if ICE connected.
			if (this.iceConnectionState === 'connected' || this.iceConnectionState === 'completed') {
				stream.emitConnected();
			}
			break;

		case 'removestream':
			stream = this.remoteStreams[data.streamId];
			event.stream = stream;

			// Remove from the remote streams.
			delete this.remoteStreams[stream.id];
			break;

		case 'datachannel':
			dataChannel = new RTCDataChannel(this, null, null, data.channel);
			event.channel = dataChannel;
			break;
	}

	this.dispatchEvent(event);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Errors":1,"./MediaStream":3,"./MediaStreamTrack":5,"./RTCDTMFSender":6,"./RTCDataChannel":7,"./RTCIceCandidate":8,"./RTCSessionDescription":10,"./RTCStatsReport":11,"./RTCStatsResponse":12,"cordova/exec":undefined,"debug":17,"random-number":22,"yaeti":23}],10:[function(_dereq_,module,exports){
/**
 * Expose the RTCSessionDescription class.
 */
module.exports = RTCSessionDescription;


function RTCSessionDescription(data) {
	data = data || {};

	// Public atributes.
	this.type = data.type;
	this.sdp = data.sdp;
}

},{}],11:[function(_dereq_,module,exports){
/**
 * Expose the RTCStatsReport class.
 */
module.exports = RTCStatsReport;

function RTCStatsReport(data) {
	data = data || [];

	this.id = data.reportId;
	this.timestamp = data.timestamp;
	this.type = data.type;

	this.names = function () {
		return Object.keys(data.values);
	};

	this.stat = function (key) {
		return data.values[key] || '';
	};
}

},{}],12:[function(_dereq_,module,exports){
/**
 * Expose the RTCStatsResponse class.
 */
module.exports = RTCStatsResponse;

function RTCStatsResponse(data) {
	data = data || [];

	this.result = function () {
		return data;
	};

	this.namedItem = function () {
		return null;
	};
}

},{}],13:[function(_dereq_,module,exports){
/**
 * Expose the enumerateDevices function.
 */
module.exports = enumerateDevices;


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:enumerateDevices'),
	exec = _dereq_('cordova/exec'),
	MediaDeviceInfo = _dereq_('./MediaDeviceInfo');


function enumerateDevices() {
	debug('');

	var isPromise,
		callback;

	if (typeof arguments[0] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[0];
	}

	if (isPromise) {
		return new Promise(function (resolve) {
			function onResultOK(data) {
				debug('enumerateDevices() | success');
				resolve(getMediaDeviceInfos(data.devices));
			}

			exec(onResultOK, null, 'iosrtcPlugin', 'enumerateDevices', []);
		});
	}

	function onResultOK(data) {
		debug('enumerateDevices() | success');
		callback(getMediaDeviceInfos(data.devices));
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'enumerateDevices', []);
}


/**
 * Private API.
 */


function getMediaDeviceInfos(devices) {
	debug('getMediaDeviceInfos() | [devices:%o]', devices);

	var id,
		mediaDeviceInfos = [];

	for (id in devices) {
		if (devices.hasOwnProperty(id)) {
			mediaDeviceInfos.push(new MediaDeviceInfo(devices[id]));
		}
	}

	return mediaDeviceInfos;
}

},{"./MediaDeviceInfo":2,"cordova/exec":undefined,"debug":17}],14:[function(_dereq_,module,exports){
/**
 * Expose the getUserMedia function.
 */
module.exports = getUserMedia;


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:getUserMedia'),
	debugerror = _dereq_('debug')('iosrtc:ERROR:getUserMedia'),
	exec = _dereq_('cordova/exec'),
	MediaStream = _dereq_('./MediaStream'),
	Errors = _dereq_('./Errors');

debugerror.log = console.warn.bind(console);


function isPositiveInteger(number) {
	return typeof number === 'number' && number >= 0 && number % 1 === 0;
}

function isPositiveFloat(number) {
	return typeof number === 'number' && number >= 0;
}


function getUserMedia(constraints) {
	debug('[original constraints:%o]', constraints);

	var
		isPromise,
		callback, errback,
		audioRequested = false,
		videoRequested = false,
		newConstraints = {
			audio: false,
			video: false
		};

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (
		typeof constraints !== 'object' ||
		(!constraints.hasOwnProperty('audio') && !constraints.hasOwnProperty('video'))
	) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.MediaStreamError('constraints must be an object with at least "audio" or "video" keys'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new Errors.MediaStreamError('constraints must be an object with at least "audio" or "video" keys'));
			}
			return;
		}
	}

	if (constraints.audio) {
		audioRequested = true;
		newConstraints.audio = true;
	}
	if (constraints.video) {
		videoRequested = true;
		newConstraints.video = true;
	}

	// Example:
	//
	// getUserMedia({
	//  audio: true,
	//  video: {
	//  	deviceId: 'qwer-asdf-zxcv',
	//  	width: {
	//  		min: 400,
	//  		max: 600
	//  	},
	//  	frameRate: {
	//  		min: 1.0,
	//  		max: 60.0
	//  	}
	//  }
	// });

	// Get video constraints
	if (videoRequested) {
		// Get requested video deviceId.
		if (typeof constraints.video.deviceId === 'string') {
			newConstraints.videoDeviceId = constraints.video.deviceId;
		// Also check sourceId (mangled by adapter.js).
		} else if (typeof constraints.video.sourceId === 'string') {
			newConstraints.videoDeviceId = constraints.video.sourceId;
		}

		// Get requested min/max width.
		if (typeof constraints.video.width === 'object') {
			if (isPositiveInteger(constraints.video.width.min)) {
				newConstraints.videoMinWidth = constraints.video.width.min;
			}
			if (isPositiveInteger(constraints.video.width.max)) {
				newConstraints.videoMaxWidth = constraints.video.width.max;
			}
		}
		// Get requested min/max height.
		if (typeof constraints.video.height === 'object') {
			if (isPositiveInteger(constraints.video.height.min)) {
				newConstraints.videoMinHeight = constraints.video.height.min;
			}
			if (isPositiveInteger(constraints.video.height.max)) {
				newConstraints.videoMaxHeight = constraints.video.height.max;
			}
		}
		// Get requested min/max frame rate.
		if (typeof constraints.video.frameRate === 'object') {
			if (isPositiveFloat(constraints.video.frameRate.min)) {
				newConstraints.videoMinFrameRate = constraints.video.frameRate.min;
			}
			if (isPositiveFloat(constraints.video.frameRate.max)) {
				newConstraints.videoMaxFrameRate = constraints.video.frameRate.max;
			}
		} else if (isPositiveFloat(constraints.video.frameRate)) {
			newConstraints.videoMinFrameRate = constraints.video.frameRate;
			newConstraints.videoMaxFrameRate = constraints.video.frameRate;
		}
	}

	debug('[computed constraints:%o]', newConstraints);

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				debug('getUserMedia() | success');
				var stream = MediaStream.create(data.stream);
				resolve(stream);
				// Emit "connected" on the stream.
				stream.emitConnected();
			}

			function onResultError(error) {
				debugerror('getUserMedia() | failure: %s', error);
				reject(new Errors.MediaStreamError('getUserMedia() failed: ' + error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'getUserMedia', [newConstraints]);
		});
	}

	function onResultOK(data) {
		debug('getUserMedia() | success');

		var stream = MediaStream.create(data.stream);

		callback(stream);

		// Emit "connected" on the stream.
		stream.emitConnected();
	}

	function onResultError(error) {
		debugerror('getUserMedia() | failure: %s', error);

		if (typeof errback === 'function') {
			errback(new Errors.MediaStreamError('getUserMedia() failed: ' + error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'getUserMedia', [newConstraints]);
}

},{"./Errors":1,"./MediaStream":3,"cordova/exec":undefined,"debug":17}],15:[function(_dereq_,module,exports){
(function (global){
/**
 * Variables.
 */

var
	// Dictionary of MediaStreamRenderers.
	// - key: MediaStreamRenderer id.
	// - value: MediaStreamRenderer.
	mediaStreamRenderers = {},

	// Dictionary of MediaStreams.
	// - key: MediaStream blobId.
	// - value: MediaStream.
	mediaStreams = {},


/**
 * Dependencies.
 */
	debug                  = _dereq_('debug')('iosrtc'),
	exec                   = _dereq_('cordova/exec'),
	domready               = _dereq_('domready'),

	getUserMedia           = _dereq_('./getUserMedia'),
	enumerateDevices       = _dereq_('./enumerateDevices'),
	RTCPeerConnection      = _dereq_('./RTCPeerConnection'),
	RTCSessionDescription  = _dereq_('./RTCSessionDescription'),
	RTCIceCandidate        = _dereq_('./RTCIceCandidate'),
	MediaStream            = _dereq_('./MediaStream'),
	MediaStreamTrack       = _dereq_('./MediaStreamTrack'),
	videoElementsHandler   = _dereq_('./videoElementsHandler');


/**
 * Expose the iosrtc object.
 */
module.exports = {
	// Expose WebRTC classes and functions.
	getUserMedia:          getUserMedia,
	enumerateDevices:      enumerateDevices,
	getMediaDevices:       enumerateDevices,  // TMP
	RTCPeerConnection:     RTCPeerConnection,
	RTCSessionDescription: RTCSessionDescription,
	RTCIceCandidate:       RTCIceCandidate,
	MediaStream:           MediaStream,
	MediaStreamTrack:      MediaStreamTrack,

	// Expose a function to refresh current videos rendering a MediaStream.
	refreshVideos:         refreshVideos,

	// Expose a function to handle a video not yet inserted in the DOM.
	observeVideo:          videoElementsHandler.observeVideo,

	// Expose a function to pollute window and naigator namespaces.
	registerGlobals:       registerGlobals,

	// Expose the debug module.
	debug:                 _dereq_('debug'),

	// Debug function to see what happens internally.
	dump:                  dump
};


domready(function () {
	// Let the MediaStream class and the videoElementsHandler share same MediaStreams container.
	MediaStream.setMediaStreams(mediaStreams);
	videoElementsHandler(mediaStreams, mediaStreamRenderers);
});


function refreshVideos() {
	debug('refreshVideos()');

	var id;

	for (id in mediaStreamRenderers) {
		if (mediaStreamRenderers.hasOwnProperty(id)) {
			mediaStreamRenderers[id].refresh();
		}
	}
}


function registerGlobals() {
	debug('registerGlobals()');

	if (!global.navigator) {
		global.navigator = {};
	}

	if (!navigator.mediaDevices) {
		navigator.mediaDevices = {};
	}

	navigator.getUserMedia                  = getUserMedia;
	navigator.webkitGetUserMedia            = getUserMedia;
	navigator.mediaDevices.getUserMedia     = getUserMedia;
	navigator.mediaDevices.enumerateDevices = enumerateDevices;
	window.RTCPeerConnection                = RTCPeerConnection;
	window.webkitRTCPeerConnection          = RTCPeerConnection;
	window.RTCSessionDescription            = RTCSessionDescription;
	window.RTCIceCandidate                  = RTCIceCandidate;
	window.MediaStream                      = MediaStream;
	window.webkitMediaStream                = MediaStream;
	window.MediaStreamTrack                 = MediaStreamTrack;
}


function dump() {
	exec(null, null, 'iosrtcPlugin', 'dump', []);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./MediaStream":3,"./MediaStreamTrack":5,"./RTCIceCandidate":8,"./RTCPeerConnection":9,"./RTCSessionDescription":10,"./enumerateDevices":13,"./getUserMedia":14,"./videoElementsHandler":16,"cordova/exec":undefined,"debug":17,"domready":19}],16:[function(_dereq_,module,exports){
(function (global){
/**
 * Expose a function that must be called when the library is loaded.
 * And also a helper function.
 */
module.exports = videoElementsHandler;
module.exports.observeVideo = observeVideo;


/**
 * Dependencies.
 */
var
	debug = _dereq_('debug')('iosrtc:videoElementsHandler'),
	MediaStreamRenderer = _dereq_('./MediaStreamRenderer'),


/**
 * Local variables.
 */

	// RegExp for MediaStream blobId.
	MEDIASTREAM_ID_REGEXP = new RegExp(/^MediaStream_/),

	// RegExp for Blob URI.
	BLOB_URI_REGEX = new RegExp(/^blob:/),

	// Dictionary of MediaStreamRenderers (provided via module argument).
	// - key: MediaStreamRenderer id.
	// - value: MediaStreamRenderer.
	mediaStreamRenderers,

	// Dictionary of MediaStreams (provided via module argument).
	// - key: MediaStream blobId.
	// - value: MediaStream.
	mediaStreams,

	// Video element mutation observer.
	videoObserver = new MutationObserver(function (mutations) {
		var i, numMutations, mutation, video;

		for (i = 0, numMutations = mutations.length; i < numMutations; i++) {
			mutation = mutations[i];

			// HTML video element.
			video = mutation.target;

			// .src or .srcObject removed.
			if (!video.src && !video.srcObject) {
				// If this video element was previously handling a MediaStreamRenderer, release it.
				releaseMediaStreamRenderer(video);
				continue;
			}

			handleVideo(video);
		}
	}),

	// DOM mutation observer.
	domObserver = new MutationObserver(function (mutations) {
		var
			i, numMutations, mutation,
			j, numNodes, node;

		for (i = 0, numMutations = mutations.length; i < numMutations; i++) {
			mutation = mutations[i];

			// Check if there has been addition or deletion of nodes.
			if (mutation.type !== 'childList') {
				continue;
			}

			// Check added nodes.
			for (j = 0, numNodes = mutation.addedNodes.length; j < numNodes; j++) {
				node = mutation.addedNodes[j];

				checkNewNode(node);
			}

			// Check removed nodes.
			for (j = 0, numNodes = mutation.removedNodes.length; j < numNodes; j++) {
				node = mutation.removedNodes[j];

				checkRemovedNode(node);
			}
		}

		function checkNewNode(node) {
			var j, childNode;

			if (node.nodeName === 'VIDEO') {
				debug('new video element added');

				// Avoid same node firing more than once (really, may happen in some cases).
				if (node._iosrtcVideoHandled) {
					return;
				}
				node._iosrtcVideoHandled = true;

				// Observe changes in the video element.
				observeVideo(node);
			} else {
				for (j = 0; j < node.childNodes.length; j++) {
					childNode = node.childNodes.item(j);

					checkNewNode(childNode);
				}
			}
		}

		function checkRemovedNode(node) {
			var j, childNode;

			if (node.nodeName === 'VIDEO') {
				debug('video element removed');

				// If this video element was previously handling a MediaStreamRenderer, release it.
				releaseMediaStreamRenderer(node);
				delete node._iosrtcVideoHandled;
			} else {
				for (j = 0; j < node.childNodes.length; j++) {
					childNode = node.childNodes.item(j);

					checkRemovedNode(childNode);
				}
			}
		}
	});


function videoElementsHandler(_mediaStreams, _mediaStreamRenderers) {
	var
		existingVideos = document.querySelectorAll('video'),
		i, len, video;

	mediaStreams = _mediaStreams;
	mediaStreamRenderers = _mediaStreamRenderers;

	// Search the whole document for already existing HTML video elements and observe them.
	for (i = 0, len = existingVideos.length; i < len; i++) {
		video = existingVideos.item(i);

		debug('video element found');

		observeVideo(video);
	}

	// Observe the whole document for additions of new HTML video elements and observe them.
	domObserver.observe(document, {
		// Set to true if additions and removals of the target node's child elements (including text nodes) are to
		// be observed.
		childList: true,
		// Set to true if mutations to target's attributes are to be observed.
		attributes: false,
		// Set to true if mutations to target's data are to be observed.
		characterData: false,
		// Set to true if mutations to not just target, but also target's descendants are to be observed.
		subtree: true,
		// Set to true if attributes is set to true and target's attribute value before the mutation needs to be
		// recorded.
		attributeOldValue: false,
		// Set to true if characterData is set to true and target's data before the mutation needs to be recorded.
		characterDataOldValue: false
		// Set to an array of attribute local names (without namespace) if not all attribute mutations need to be
		// observed.
		// attributeFilter:
	});
}


function observeVideo(video) {
	debug('observeVideo()');

	// If the video already has a src/srcObject property but is not yet handled by the plugin
	// then handle it now.
	if ((video.src || video.srcObject) && !video._iosrtcMediaStreamRendererId) {
		handleVideo(video);
	}

	// Add .src observer to the video element.
	videoObserver.observe(video, {
		// Set to true if additions and removals of the target node's child elements (including text
		// nodes) are to be observed.
		childList: false,
		// Set to true if mutations to target's attributes are to be observed.
		attributes: true,
		// Set to true if mutations to target's data are to be observed.
		characterData: false,
		// Set to true if mutations to not just target, but also target's descendants are to be observed.
		subtree: false,
		// Set to true if attributes is set to true and target's attribute value before the mutation
		// needs to be recorded.
		attributeOldValue: false,
		// Set to true if characterData is set to true and target's data before the mutation needs to be
		// recorded.
		characterDataOldValue: false,
		// Set to an array of attribute local names (without namespace) if not all attribute mutations
		// need to be observed.
		attributeFilter: ['src', 'srcObject']
	});

	// Intercept video 'error' events if it's due to the attached MediaStream.
	video.addEventListener('error', function (event) {
		if (video.error.code === global.MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED && BLOB_URI_REGEX.test(video.src)) {
			debug('stopping "error" event propagation for video element');

			event.stopImmediatePropagation();
		}
	});
}


/**
 * Private API.
 */

function handleVideo(video) {
	var
		xhr = new XMLHttpRequest(),
		stream;

	// The app has set video.src.
	if (video.src) {
		xhr.open('GET', video.src, true);
		xhr.responseType = 'blob';
		xhr.onload = function () {
			if (xhr.status !== 200) {
				// If this video element was previously handling a MediaStreamRenderer, release it.
				releaseMediaStreamRenderer(video);

				return;
			}

			var reader = new FileReader();

			// Some versions of Safari fail to set onloadend property, some others do not react
			// on 'loadend' event. Try everything here.
			try {
				reader.onloadend = onloadend;
			} catch (error) {
				reader.addEventListener('loadend', onloadend);
			}
			reader.readAsText(xhr.response);

			function onloadend() {
				var mediaStreamBlobId = reader.result;

				// The retrieved URL does not point to a MediaStream.
				if (!mediaStreamBlobId || typeof mediaStreamBlobId !== 'string' || !MEDIASTREAM_ID_REGEXP.test(mediaStreamBlobId)) {
					// If this video element was previously handling a MediaStreamRenderer, release it.
					releaseMediaStreamRenderer(video);

					return;
				}

				provideMediaStreamRenderer(video, mediaStreamBlobId);
			}
		};
		xhr.send();
	}

	// The app has set video.srcObject.
	else if (video.srcObject) {
		stream = video.srcObject;

		if (!stream.getBlobId()) {
			// If this video element was previously handling a MediaStreamRenderer, release it.
			releaseMediaStreamRenderer(video);

			return;
		}

		provideMediaStreamRenderer(video, stream.getBlobId());
	}
}


function provideMediaStreamRenderer(video, mediaStreamBlobId) {
	var
		mediaStream = mediaStreams[mediaStreamBlobId],
		mediaStreamRenderer = mediaStreamRenderers[video._iosrtcMediaStreamRendererId];

	if (!mediaStream) {
		releaseMediaStreamRenderer(video);

		return;
	}

	if (mediaStreamRenderer) {
		mediaStreamRenderer.render(mediaStream);
	} else {
		mediaStreamRenderer = new MediaStreamRenderer(video);
		mediaStreamRenderer.render(mediaStream);

		mediaStreamRenderers[mediaStreamRenderer.id] = mediaStreamRenderer;
		video._iosrtcMediaStreamRendererId = mediaStreamRenderer.id;
	}

	// Close the MediaStreamRenderer of this video if it emits "close" event.
	mediaStreamRenderer.addEventListener('close', function () {
		if (mediaStreamRenderers[video._iosrtcMediaStreamRendererId] !== mediaStreamRenderer) {
			return;
		}

		releaseMediaStreamRenderer(video);
	});

	// Override some <video> properties.
	// NOTE: This is a terrible hack but it works.
	Object.defineProperties(video, {
		videoWidth: {
			configurable: true,
			get: function () {
				return mediaStreamRenderer.videoWidth || 0;
			}
		},
		videoHeight: {
			configurable: true,
			get: function () {
				return mediaStreamRenderer.videoHeight || 0;
			}
		},
		readyState: {
			configurable: true,
			get: function () {
				if (mediaStreamRenderer && mediaStreamRenderer.stream && mediaStreamRenderer.stream.connected) {
					return video.HAVE_ENOUGH_DATA;
				} else {
					return video.HAVE_NOTHING;
				}
			}
		}
	});
}


function releaseMediaStreamRenderer(video) {
	if (!video._iosrtcMediaStreamRendererId) {
		return;
	}

	var mediaStreamRenderer = mediaStreamRenderers[video._iosrtcMediaStreamRendererId];

	if (mediaStreamRenderer) {
		delete mediaStreamRenderers[video._iosrtcMediaStreamRendererId];
		mediaStreamRenderer.close();
	}

	delete video._iosrtcMediaStreamRendererId;

	// Remove overrided <video> properties.
	delete video.videoWidth;
	delete video.videoHeight;
	delete video.readyState;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./MediaStreamRenderer":4,"debug":17}],17:[function(_dereq_,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = _dereq_('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,_dereq_('_process'))
},{"./debug":18,"_process":21}],18:[function(_dereq_,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = _dereq_('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":20}],19:[function(_dereq_,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn)
  }

});

},{}],20:[function(_dereq_,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],21:[function(_dereq_,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],22:[function(_dereq_,module,exports){
void function(root){

  function defaults(options){
    var options = options || {}
    var min = options.min
    var max = options.max
    var integer = options.integer || false
    if ( min == null && max == null ) {
      min = 0
      max = 1
    } else if ( min == null ) {
      min = max - 1
    } else if ( max == null ) {
      max = min + 1
    }
    if ( max < min ) throw new Error('invalid options, max must be >= min')
    return {
      min:     min
    , max:     max
    , integer: integer
    }
  }

  function random(options){
    options = defaults(options)
    if ( options.max === options.min ) return options.min
    var r = Math.random() * (options.max - options.min + Number(!!options.integer)) + options.min
    return options.integer ? Math.floor(r) : r
  }

  function generator(options){
    options = defaults(options)
    return function(min, max, integer){
      options.min     = min != null ? min : options.min
      options.max     = max != null ? max : options.max
      options.integer = integer != null ? integer : options.integer
      return random(options)
    }
  }

  module.exports =  random
  module.exports.generator = generator
  module.exports.defaults = defaults
}(this)

},{}],23:[function(_dereq_,module,exports){
module.exports = {
	EventTarget : _dereq_('./lib/EventTarget'),
	Event       : _dereq_('./lib/Event')
};

},{"./lib/Event":24,"./lib/EventTarget":25}],24:[function(_dereq_,module,exports){
(function (global){
/**
 * In browsers export the native Event interface.
 */

module.exports = global.Event;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],25:[function(_dereq_,module,exports){
/**
 * Expose the _EventTarget class.
 */
module.exports = _EventTarget;

function _EventTarget() {
	// Do nothing if called for a native EventTarget object..
	if (typeof this.addEventListener === 'function') {
		return;
	}

	this._listeners = {};

	this.addEventListener = _addEventListener;
	this.removeEventListener = _removeEventListener;
	this.dispatchEvent = _dispatchEvent;
}

Object.defineProperties(_EventTarget.prototype, {
	listeners: {
		get: function () {
			return this._listeners;
		}
	}
});

function _addEventListener(type, newListener) {
	var
		listenersType,
		i, listener;

	if (!type || !newListener) {
		return;
	}

	listenersType = this._listeners[type];
	if (listenersType === undefined) {
		this._listeners[type] = listenersType = [];
	}

	for (i = 0; !!(listener = listenersType[i]); i++) {
		if (listener === newListener) {
			return;
		}
	}

	listenersType.push(newListener);
}

function _removeEventListener(type, oldListener) {
	var
		listenersType,
		i, listener;

	if (!type || !oldListener) {
		return;
	}

	listenersType = this._listeners[type];
	if (listenersType === undefined) {
		return;
	}

	for (i = 0; !!(listener = listenersType[i]); i++) {
		if (listener === oldListener) {
			listenersType.splice(i, 1);
			break;
		}
	}

	if (listenersType.length === 0) {
		delete this._listeners[type];
	}
}

function _dispatchEvent(event) {
	var
		type,
		listenersType,
		dummyListener,
		stopImmediatePropagation = false,
		i, listener;

	if (!event || typeof event.type !== 'string') {
		throw new Error('`event` must have a valid `type` property');
	}

	// Do some stuff to emulate DOM Event behavior (just if this is not a
	// DOM Event object)
	if (event._yaeti) {
		event.target = this;
		event.cancelable = true;
	}

	// Attempt to override the stopImmediatePropagation() method
	try {
		event.stopImmediatePropagation = function () {
			stopImmediatePropagation = true;
		};
	} catch (error) {}

	type = event.type;
	listenersType = (this._listeners[type] || []);

	dummyListener = this['on' + type];
	if (typeof dummyListener === 'function') {
		dummyListener.call(this, event);
	}

	for (i = 0; !!(listener = listenersType[i]); i++) {
		if (stopImmediatePropagation) {
			break;
		}

		listener.call(this, event);
	}

	return !event.defaultPrevented;
}

},{}]},{},[15])(15)
});
});

;
cordova.define("cordova-sms-plugin.Sms", function(require, exports, module) {
'use strict';

var exec = require('cordova/exec');

var sms = {};

function convertPhoneToArray(phone) {
    if (typeof phone === 'string' && phone.indexOf(',') !== -1) {
        phone = phone.split(',');
    }
    if (Object.prototype.toString.call(phone) !== '[object Array]') {
        phone = [phone];
    }
    return phone;
}


sms.send = function(phone, message, options, success, failure) {
    // parsing phone numbers
    phone = convertPhoneToArray(phone);

    // parsing options
    var replaceLineBreaks = false;
    var androidIntent = '';
    if (typeof options === 'string') { // ensuring backward compatibility
        window.console.warn('[DEPRECATED] Passing a string as a third argument is deprecated. Please refer to the documentation to pass the right parameter: https://github.com/cordova-sms/cordova-sms-plugin.');
        androidIntent = options;
    }
    else if (typeof options === 'object') {
        replaceLineBreaks = options.replaceLineBreaks || false;
        if (options.android && typeof options.android === 'object') {
            androidIntent = options.android.intent;
        }
    }

    // fire
    exec(
        success,
        failure,
        'Sms',
        'send', [phone, message, androidIntent, replaceLineBreaks]
    );
};

sms.hasPermission = function(success, failure) {
    // fire
    exec(
        success,
        failure,
        'Sms',
        'has_permission', []
    );
};

module.exports = sms;
});

;
cordova.define("cordova-universal-links-plugin.universalLinks", function(require, exports, module) {
var exec = require('cordova/exec'),
  channel = require('cordova/channel'),

  // Reference name for the plugin
  PLUGIN_NAME = 'UniversalLinks',

  // Default event name that is used by the plugin
  DEFAULT_EVENT_NAME = 'didLaunchAppFromLink';

// Plugin methods on the native side that can be called from JavaScript
pluginNativeMethod = {
  SUBSCRIBE: 'jsSubscribeForEvent',
  UNSUBSCRIBE: 'jsUnsubscribeFromEvent'
};

var universalLinks = {

  /**
   * Subscribe to event.
   * If plugin already captured that event - callback will be called immidietly.
   *
   * @param {String} eventName - name of the event you are subscribing on; if null - default plugin event is used
   * @param {Function} callback - callback that is called when event is captured
   */
  subscribe: function(eventName, callback) {
    if (!callback) {
      console.warn('Universal Links: can\'t subscribe to event without a callback');
      return;
    }

    if (!eventName) {
      eventName = DEFAULT_EVENT_NAME;
    }

    var innerCallback = function(msg) {
      callback(msg.data);
    };

    exec(innerCallback, null, PLUGIN_NAME, pluginNativeMethod.SUBSCRIBE, [eventName]);
  },

  /**
   * Unsubscribe from the event.
   *
   * @param {String} eventName - from what event we are unsubscribing
   */
  unsubscribe: function(eventName) {
    if (!eventName) {
      eventName = DEFAULT_EVENT_NAME;
    }

    exec(null, null, PLUGIN_NAME, pluginNativeMethod.UNSUBSCRIBE, [eventName]);
  }
};

module.exports = universalLinks;

});

;
cordova.define("phonegap-plugin-push.PushNotification", function(require, exports, module) {
/**
* This file has been generated by Babel.
* 
* DO NOT EDIT IT DIRECTLY
* 
* Edit the JS source file src/js/push.js
**/'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* global cordova:false */
/* globals window */

/*!
 * Module dependencies.
 */

var exec = cordova.require('cordova/exec');

var PushNotification = function () {
  /**
   * PushNotification constructor.
   *
   * @param {Object} options to initiate Push Notifications.
   * @return {PushNotification} instance that can be monitored and cancelled.
   */
  function PushNotification(options) {
    var _this = this;

    _classCallCheck(this, PushNotification);

    this.handlers = {
      registration: [],
      notification: [],
      error: []
    };

    // require options parameter
    if (typeof options === 'undefined') {
      throw new Error('The options argument is required.');
    }

    // store the options to this object instance
    this.options = options;

    // triggered on registration and notification
    var success = function success(result) {
      if (result && typeof result.registrationId !== 'undefined') {
        _this.emit('registration', result);
      } else if (result && result.additionalData && typeof result.additionalData.actionCallback !== 'undefined') {
        _this.emit(result.additionalData.actionCallback, result);
      } else if (result) {
        _this.emit('notification', result);
      }
    };

    // triggered on error
    var fail = function fail(msg) {
      var e = typeof msg === 'string' ? new Error(msg) : msg;
      _this.emit('error', e);
    };

    // wait at least one process tick to allow event subscriptions
    setTimeout(function () {
      exec(success, fail, 'PushNotification', 'init', [options]);
    }, 10);
  }

  /**
   * Unregister from push notifications
   */


  _createClass(PushNotification, [{
    key: 'unregister',
    value: function unregister(successCallback) {
      var _this2 = this;

      var errorCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
      var options = arguments[2];

      if (typeof errorCallback !== 'function') {
        console.log('PushNotification.unregister failure: failure parameter not a function');
        return;
      }

      if (typeof successCallback !== 'function') {
        console.log('PushNotification.unregister failure: success callback parameter must be a function');
        return;
      }

      var cleanHandlersAndPassThrough = function cleanHandlersAndPassThrough() {
        if (!options) {
          _this2.handlers = {
            registration: [],
            notification: [],
            error: []
          };
        }
        successCallback();
      };

      exec(cleanHandlersAndPassThrough, errorCallback, 'PushNotification', 'unregister', [options]);
    }

    /**
     * subscribe to a topic
     * @param   {String}      topic               topic to subscribe
     * @param   {Function}    successCallback     success callback
     * @param   {Function}    errorCallback       error callback
     * @return  {void}
     */

  }, {
    key: 'subscribe',
    value: function subscribe(topic, successCallback) {
      var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

      if (typeof errorCallback !== 'function') {
        console.log('PushNotification.subscribe failure: failure parameter not a function');
        return;
      }

      if (typeof successCallback !== 'function') {
        console.log('PushNotification.subscribe failure: success callback parameter must be a function');
        return;
      }

      exec(successCallback, errorCallback, 'PushNotification', 'subscribe', [topic]);
    }

    /**
     * unsubscribe to a topic
     * @param   {String}      topic               topic to unsubscribe
     * @param   {Function}    successCallback     success callback
     * @param   {Function}    errorCallback       error callback
     * @return  {void}
     */

  }, {
    key: 'unsubscribe',
    value: function unsubscribe(topic, successCallback) {
      var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

      if (typeof errorCallback !== 'function') {
        console.log('PushNotification.unsubscribe failure: failure parameter not a function');
        return;
      }

      if (typeof successCallback !== 'function') {
        console.log('PushNotification.unsubscribe failure: success callback parameter must be a function');
        return;
      }

      exec(successCallback, errorCallback, 'PushNotification', 'unsubscribe', [topic]);
    }

    /**
     * Call this to set the application icon badge
     */

  }, {
    key: 'setApplicationIconBadgeNumber',
    value: function setApplicationIconBadgeNumber(successCallback) {
      var errorCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
      var badge = arguments[2];

      if (typeof errorCallback !== 'function') {
        console.log('PushNotification.setApplicationIconBadgeNumber failure: failure ' + 'parameter not a function');
        return;
      }

      if (typeof successCallback !== 'function') {
        console.log('PushNotification.setApplicationIconBadgeNumber failure: success ' + 'callback parameter must be a function');
        return;
      }

      exec(successCallback, errorCallback, 'PushNotification', 'setApplicationIconBadgeNumber', [{ badge: badge }]);
    }

    /**
     * Get the application icon badge
     */

  }, {
    key: 'getApplicationIconBadgeNumber',
    value: function getApplicationIconBadgeNumber(successCallback) {
      var errorCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

      if (typeof errorCallback !== 'function') {
        console.log('PushNotification.getApplicationIconBadgeNumber failure: failure ' + 'parameter not a function');
        return;
      }

      if (typeof successCallback !== 'function') {
        console.log('PushNotification.getApplicationIconBadgeNumber failure: success ' + 'callback parameter must be a function');
        return;
      }

      exec(successCallback, errorCallback, 'PushNotification', 'getApplicationIconBadgeNumber', []);
    }

    /**
     * Clear all notifications
     */

  }, {
    key: 'clearAllNotifications',
    value: function clearAllNotifications() {
      var successCallback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var errorCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

      if (typeof errorCallback !== 'function') {
        console.log('PushNotification.clearAllNotifications failure: failure parameter not a function');
        return;
      }

      if (typeof successCallback !== 'function') {
        console.log('PushNotification.clearAllNotifications failure: success callback ' + 'parameter must be a function');
        return;
      }

      exec(successCallback, errorCallback, 'PushNotification', 'clearAllNotifications', []);
    }
    /**
     * Listen for an event.
     *
     * The following events are supported:
     *
     *   - registration
     *   - notification
     *   - error
     *
     * @param {String} eventName to subscribe to.
     * @param {Function} callback triggered on the event.
     */

  }, {
    key: 'on',
    value: function on(eventName, callback) {
      if (!this.handlers.hasOwnProperty(eventName)) {
        this.handlers[eventName] = [];
      }
      this.handlers[eventName].push(callback);
    }

    /**
     * Remove event listener.
     *
     * @param {String} eventName to match subscription.
     * @param {Function} handle function associated with event.
     */

  }, {
    key: 'off',
    value: function off(eventName, handle) {
      if (this.handlers.hasOwnProperty(eventName)) {
        var handleIndex = this.handlers[eventName].indexOf(handle);
        if (handleIndex >= 0) {
          this.handlers[eventName].splice(handleIndex, 1);
        }
      }
    }

    /**
     * Emit an event.
     *
     * This is intended for internal use only.
     *
     * @param {String} eventName is the event to trigger.
     * @param {*} all arguments are passed to the event listeners.
     *
     * @return {Boolean} is true when the event is triggered otherwise false.
     */

  }, {
    key: 'emit',
    value: function emit() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var eventName = args.shift();

      if (!this.handlers.hasOwnProperty(eventName)) {
        return false;
      }

      for (var i = 0, length = this.handlers[eventName].length; i < length; i++) {
        var callback = this.handlers[eventName][i];
        if (typeof callback === 'function') {
          callback.apply(undefined, args);
        } else {
          console.log('event handler: ' + eventName + ' must be a function');
        }
      }

      return true;
    }
  }, {
    key: 'finish',
    value: function finish() {
      var successCallback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var errorCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
      var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'handler';

      if (typeof successCallback !== 'function') {
        console.log('finish failure: success callback parameter must be a function');
        return;
      }

      if (typeof errorCallback !== 'function') {
        console.log('finish failure: failure parameter not a function');
        return;
      }

      exec(successCallback, errorCallback, 'PushNotification', 'finish', [id]);
    }
  }]);

  return PushNotification;
}();

/*!
 * Push Notification Plugin.
 */

module.exports = {
  /**
   * Register for Push Notifications.
   *
   * This method will instantiate a new copy of the PushNotification object
   * and start the registration process.
   *
   * @param {Object} options
   * @return {PushNotification} instance
   */

  init: function init(options) {
    return new PushNotification(options);
  },

  hasPermission: function hasPermission(successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'PushNotification', 'hasPermission', []);
  },

  createChannel: function createChannel(successCallback, errorCallback, channel) {
    exec(successCallback, errorCallback, 'PushNotification', 'createChannel', [channel]);
  },

  deleteChannel: function deleteChannel(successCallback, errorCallback, channelId) {
    exec(successCallback, errorCallback, 'PushNotification', 'deleteChannel', [channelId]);
  },

  listChannels: function listChannels(successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'PushNotification', 'listChannels', []);
  },

  /**
   * PushNotification Object.
   *
   * Expose the PushNotification object for direct use
   * and testing. Typically, you should use the
   * .init helper method.
   */
  PushNotification: PushNotification
};
});
