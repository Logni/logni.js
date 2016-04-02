var SiUXNotifierParam = {
        'id'                    : '0d7061a0f59ca031d7246f5bf7b849ba', 
        'urlNotify'             : '//#{RUM_HOSTNAME_ONLINE}/notifier',
        'urlJsLogni'            : '/js/ni/logni.js?v=${now()}',
        'debug'                 : ${._developMode},
        'captureUncaught'       : true
};

var SiUXNotifier = {};

SiUXNotifier.urlNotify          = 'https://logni-online.esiux.com/notifier';
SiUXNotifier.urlJsLogni         = 'https://logni.esiux.com/js/logni/logni.min.js';
SiUXNotifier.debug              = false;
SiUXNotifier.captureUncaught    = false;
SiUXNotifier.loadScriptAsync    = false;
SiUXNotifier.logMask            = 'I3E1F1W2';

SiUXNotifier.init = function()
{
        if (typeof SiUXNotifierParam === 'undefined' || typeof SiUXNotifierParam.id === 'undefined')
                return;

        SiUXNotifier.id                 = SiUXNotifierParam.id;
        SiUXNotifier.wrappedFuncError   = null;
        SiUXNotifier.logList            = [];
        SiUXNotifier.errList            = [];
        SiUXNotifier.docLocOrigin       = document.location.protocol + "//" + document.location.hostname + document.location.pathname;

        if (typeof SiUXNotifierParam.urlNotify !== 'undefined')
                SiUXNotifier.urlNotify = SiUXNotifierParam.urlNotify;

        if (typeof SiUXNotifierParam.urlJsLogni !== 'undefined')
                SiUXNotifier.urlJsLogni = SiUXNotifierParam.urlJsLogni;

        if (typeof SiUXNotifierParam.debug !== 'undefined')
                SiUXNotifier.debug = SiUXNotifierParam.debug;

        if (typeof SiUXNotifierParam.captureUncaught !== 'undefined')
                SiUXNotifier.captureUncaught = SiUXNotifierParam.captureUncaught;

        if (typeof SiUXNotifierParam.loadScriptAsync !== 'undefined')
                SiUXNotifier.loadScriptAsync = SiUXNotifierParam.loadScriptAsync;

        if (typeof SiUXNotifierParam.logMask !== 'undefined')
                SiUXNotifier.logMask = SiUXNotifierParam.logMask;

        setTimeout(function() { SiUXNotifier.addScript(SiUXNotifier.urlJsLogni, SiUXNotifier.logInit); }, 0);

        SiUXNotifier.addEventListener(window, 'load', SiUXNotifier.windowOnLoad);

        if (SiUXNotifier.captureUncaught) {

                window.onerror = SiUXNotifier.wrapInternalFuncError( SiUXNotifier.windowOnError() );

                // Adapted from https://github.com/bugsnag/bugsnag-js
                var listenerList = 'EventTarget,Window,Node,ApplicationCache,AudioTrackList,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload'.split(',');

                for (var i=0; i<listenerList.length; i++)
                        SiUXNotifier.wrapEventListener( listenerList[i] );
        }
}

SiUXNotifier.console = function(type, text)
{
        if (typeof console !== "undefined" && console !== null & SiUXNotifierParam.debug) {
                if (arguments.length > 2)
                        console[type]( text, arguments[2] );
                else
                        console[type]( text );
        }
}

SiUXNotifier.wrapInternalFuncError = function(func)
{
        return function() {
                try {
                        return func.apply(this, arguments);
                } catch(e) {
                        SiUXNotifier.console('error', 'SiUX Notifier: Internal error, ', e);
                }
        };
}

SiUXNotifier.wrapFuncError = function(func, listener)
{
        try {
                if (typeof func !== 'function')
                        return func;

                if ( !func._wrap ) {
                        func._wrap = function() {
                                try {
                                        func.apply(this, arguments);
                                } catch(e) {
                                        SiUXNotifier.wrappedFuncError = e;
                                        SiUXNotifier.console('log', 'SiUX Notifier: event error, ', e);
                                        throw e;
                                }
                        }
                }

                for (var prop in func)
                        func._wrap[prop] = func[prop];

                return func._wrap;
        }
        catch(e) {
                return func;
        }
}

SiUXNotifier.wrapEventListener = function(listener)
{
        if (typeof window[listener] === 'undefined' || typeof window[listener].prototype === 'undefined')
                return;

        var addEventListener = window[listener].prototype.addEventListener;
        window[listener].prototype.addEventListener = function(event, callback, bubble) {
                addEventListener.call(this, event, SiUXNotifier.wrapFuncError(callback, listener), bubble);
        }

        var removeEventListener = window[listener].prototype.removeEventListener;
        window[listener].prototype.removeEventListener = function(event, callback, bubble) {
                removeEventListener.call(this, event, callback._wrap || callback, bubble);
        }
}

SiUXNotifier.windowOnError = function()
{
        return function() {
                var argList = Array.prototype.slice.call(arguments, 0);
               
                if ( SiUXNotifier.wrappedFuncError && !argList[4] )
                        argList[4] = SiUXNotifier.wrappedFuncError;

                SiUXNotifier.wrappedFuncError = null;
                
                SiUXNotifier.console( 'log', 'SiUX Notifier: window onerror, ', argList[0] );

                var errInfo = {
                        'message'       : argList[0],
                        'source'        : argList[1],
                        'lineno'        : argList[2],
                        'colno'         : argList[3],
                        'stack'         : ''
                }

                if (argList[4] && typeof argList[4].stack !== 'undefined')
                        errInfo.stack = argList[4].stack;

                SiUXNotifier.log('SiUX Notifier: %s', [ argList[0] ], 'ERR', 4, errInfo);
        };
}

SiUXNotifier.windowOnLoad = function()
{
        // send saved client log
        if (typeof log === 'undefined' || typeof log.ni === 'undefined') {

                SiUXNotifier.sendLog(SiUXNotifier.logList);

                SiUXNotifier.logList = [];
        }
}

SiUXNotifier.addEventListener = function(elem, sType, fn, capture)
{
        capture = (capture) ? true : false;
        if (elem.addEventListener)
                elem.addEventListener(sType, fn, capture);

        else if (elem.attachEvent)
                elem.attachEvent("on" + sType, fn);

        else {
                if ( elem["on" + sType] ) {} // Netscape 4
                else
                        elem["on" + sType] = fn;
        }
}

SiUXNotifier.addScript = function(src, callback)
{
        var headElem     = document.getElementsByTagName("head")[0];
        var scriptElem   = document.createElement('script');
        scriptElem.type  = 'text/javascript';
        scriptElem.src   = src;
        scriptElem.async = SiUXNotifier.loadScriptAsync;

        scriptElem.onreadystatechange = scriptElem.onload = SiUXNotifier.wrapInternalFuncError(function() {
                if ( !this.readyState || this.readyState === 'loaded' || this.readyState === 'complete' )
                        callback();
        });

        headElem.appendChild(scriptElem);
}

SiUXNotifier.logInit = function()
{
        log.mask(SiUXNotifier.logMask);
        log.file(SiUXNotifier.urlNotify);
        log.method('POST');

        if (typeof console !== "undefined" && console !== null & SiUXNotifierParam.debug)
                log.stderr(1);

        if (SiUXNotifierParam.debug)
                SiUXNotifier.console('log', 'SiUX Notifier: logni init');

        // send saved error log
        SiUXNotifier.sendLog(SiUXNotifier.errList);

        SiUXNotifier.errList = [];

        // send saved client log
        if (SiUXNotifier.logList.length > 0) {
                SiUXNotifier.sendLog(SiUXNotifier.logList);

                SiUXNotifier.logList = [];
        }
}

SiUXNotifier.sendLog = function(logList)
{
        if (logList.length == 0)
                return;

        var logInfo = null;

        var msgList     = [];
        var paramList   = [];
        var maskList    = [];
        var depthList   = [];
        var dataList    = [];

        for (var i=0; i<logList.length; i++) {

                logInfo = logList[i];

                msgList.push( logInfo['msg'] );
                paramList.push( logInfo['paramList'] );
                maskList.push( logInfo['mask'] );
                depthList.push( logInfo['depth'] );
                dataList.push( logInfo['data'] );
        }

        log.ni(msgList, paramList, maskList, depthList, dataList);
}

SiUXNotifier.log = function(msg, paramList, mask, depth)
{
        var data = {};
        if (arguments.length > 4)
                data = arguments[4];

        // external js logni is not loaded, save log and send later 
        if (typeof log === 'undefined' || typeof log.ni === 'undefined') {

                var logInfo = {
                        'msg'           : msg,
                        'paramList'     : paramList,
                        'mask'          : mask,
                        'depth'         : depth,
                        'data'          : data
                };

                if (arguments.length > 4)
                        SiUXNotifier.errList.push(logInfo);
                else
                        SiUXNotifier.logList.push(logInfo);

                return;
        }

        data.id         = SiUXNotifier.id;
        data.origin     = encodeURIComponent(SiUXNotifier.docLocOrigin)

        log.ni(msg, paramList, mask, depth, data);
}

SiUXNotifier.init();
