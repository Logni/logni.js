var SiUXNotifier = {};

SiUXNotifier.urlNotify          = 'https://logni-online.esiux.com/notifier';
SiUXNotifier.urlJsLogni         = 'https://cdn-logni-static.esiux.com/js/logni/logni.min.js?v=__VERSION__';
SiUXNotifier.urlJsNotifier      = 'https://cdn-logni-static.esiux.com/js/logni/notifier_ext.min.js?v=__VERSION__';
SiUXNotifier.debug              = false;
SiUXNotifier.captureUncaught    = false;
SiUXNotifier.loadScriptAsync    = false;
SiUXNotifier.logMask            = 'I3E1F1W2';
SiUXNotifier.clientData         = {
        'environment'           : null,
        'revision'              : null,
        'personId'              : null,
        'personUsername'        : null,
        'personEmail'           : null
}
SiUXNotifier.versionInline      = '__VERSION__';

SiUXNotifier.init = function()
{
        if (typeof SiUXNotifierParam === 'undefined' || typeof SiUXNotifierParam.id === 'undefined')
                return;

        SiUXNotifier.id                 = SiUXNotifierParam.id;
        SiUXNotifier.wrappedFuncError   = null;
        SiUXNotifier.logList            = [];
        SiUXNotifier.errList            = [];

        if (typeof SiUXNotifierParam.urlNotify !== 'undefined')
                SiUXNotifier.urlNotify = SiUXNotifierParam.urlNotify;

        if (typeof SiUXNotifierParam.urlJsLogni !== 'undefined')
                SiUXNotifier.urlJsLogni = SiUXNotifierParam.urlJsLogni;

        if (typeof SiUXNotifierParam.urlJsNotifier !== 'undefined')
                SiUXNotifier.urlJsNotifier = SiUXNotifierParam.urlJsNotifier;

        if (typeof SiUXNotifierParam.debug !== 'undefined')
                SiUXNotifier.debug = SiUXNotifierParam.debug;

        if (typeof SiUXNotifierParam.captureUncaught !== 'undefined')
                SiUXNotifier.captureUncaught = SiUXNotifierParam.captureUncaught;

        if (typeof SiUXNotifierParam.loadScriptAsync !== 'undefined')
                SiUXNotifier.loadScriptAsync = SiUXNotifierParam.loadScriptAsync;

        if (typeof SiUXNotifierParam.logMask !== 'undefined')
                SiUXNotifier.logMask = SiUXNotifierParam.logMask;

        if (typeof SiUXNotifierParam.data !== 'undefined') {

                for (var dataKey in SiUXNotifierParam.data) {

                        try {
                                if (dataKey == 'environment' || dataKey == 'revision' || dataKey == 'personUsername' || dataKey == 'personEmail')
                                        SiUXNotifier.clientData[dataKey] = SiUXNotifierParam.data[dataKey].toString();
                                
                                else if (dataKey == 'personId')
                                        SiUXNotifier.clientData[dataKey] = parseInt( SiUXNotifierParam.data[dataKey] );
                        } catch(e) {
                                SiUXNotifier.console('error', 'SiUX Notifier: Type of client data, ', e);
                        }
                }
        }

        setTimeout(function() { SiUXNotifier.addScript(SiUXNotifier.urlJsNotifier, SiUXNotifier.notifierInit); }, 0);

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
                        'colno'         : argList[3] || 0,
                        'stack'         : ''
                }

                if (argList[4] && typeof argList[4].stack !== 'undefined')
                        errInfo.stack = argList[4].stack;

                SiUXNotifier.log('SiUX Notifier: %s', [ argList[0] ], 'ERR', 4, errInfo);
        };
}

SiUXNotifier.isJsCompletelyLoaded = function()
{
        // logni.js and notifier_ext.js are loaded?
        if (typeof log === 'undefined' || typeof log.ni === 'undefined' || typeof SiUXNotifier.userIdent === 'undefined')
                return false;

        return true;
}

SiUXNotifier.windowOnLoad = function()
{
        // send saved client log
        if ( SiUXNotifier.isJsCompletelyLoaded() ) {

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

        if ( SiUXNotifier.isJsCompletelyLoaded() )
                SiUXNotifier.jsCompletelyLoaded();
}

SiUXNotifier.notifierInit = function()
{
        SiUXNotifier.notifierInitExt();
}

SiUXNotifier.log = function(msg, paramList, mask, depth)
{
        var data = {};
        if (arguments.length > 4)
                data = arguments[4];

        // external logni.js and notifier_ext.js are not loaded, save log and send later 
        if ( !SiUXNotifier.isJsCompletelyLoaded() ) {

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

        SiUXNotifier.logni(msg, paramList, mask, depth, data, false);
}

SiUXNotifier.init();
