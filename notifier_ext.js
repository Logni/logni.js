Cookie = {
        set: function(input)
        {
                var name = "";
                if (input.name)
                        name = input.name;

                var value = "";
                if (input.value)
                        value = input.value;

                var tenYearsAhead = new Date();
                tenYearsAhead.setFullYear(tenYearsAhead.getFullYear() + 10);

                var expiry = tenYearsAhead.toUTCString();
                if (input.expiry)
                        expiry = input.expiry.toUTCString();

                var path = "/";
                if (input.path)
                        path = input.path;

                var domain = "";
                if (input.domain)
                        domain = input.domain;

                document.cookie = escape(name) + "=" + escape(value) + "; expires=" + expiry + "; path=" + path + "; domain=" + domain;
        },
        get: function(name)
        {
                var cookieFinder = new RegExp("(^|;) ?" + name + "=([^;]*)(;|$)");
                var cookie = document.cookie.match(cookieFinder);

                var value = "";
                if (cookie)
                        value = unescape( cookie[2] );

                return value;
        }
};

if (typeof SiUXNotifier === 'undefined')
        var SiUXNotifier = {};

SiUXNotifier.userIdentCookie    = 'ni-notifier-userid';
SiUXNotifier.userIdent          = Cookie.get(SiUXNotifier.userIdentCookie);
SiUXNotifier.sendingFirstLog    = false;
SiUXNotifier.docLocOrigin       = document.location.protocol + "//" + document.location.hostname + document.location.pathname;
SiUXNotifier.session            = null;                                                                                                 // all requests on one page from one client
SiUXNotifier.version            = '0.0.1';

SiUXNotifier.notifierInitExt = function()
{
        if (SiUXNotifierParam.debug)
                SiUXNotifier.console('log', 'SiUX Notifier: notifier extend init');

        // user identifier
        if ( !SiUXNotifier.userIdent ) {
                SiUXNotifier.userIdent = ( new Date().getTime().toString() + ( new Array(32).join().replace( /(.|$)/g, function() { return ( (Math.random()*36) | 0 ).toString(36) } ) ) ).substring(0, 32);

                Cookie.set({
                        'name'  : SiUXNotifier.userIdentCookie,
                        'value' : SiUXNotifier.userIdent,
                        'domain': document.location.hostname.split('.').slice(-2).join('.')     // secondlevel domain of a website
                });
        }

        if ( SiUXNotifier.isJsCompletelyLoaded() )
                SiUXNotifier.jsCompletelyLoaded();
}

SiUXNotifier.jsCompletelyLoaded = function()
{
        // send saved error log
        SiUXNotifier.sendLog(SiUXNotifier.errList);

        SiUXNotifier.errList = [];

        // send saved client log
        if (SiUXNotifier.logList.length > 0) {
                SiUXNotifier.sendLog(SiUXNotifier.logList);

                SiUXNotifier.logList = [];
        }
}

SiUXNotifier.setBasicData = function(data)
{
        // first request - send all data, other request - send only session
        if (SiUXNotifier.session) {
                data.session = SiUXNotifier.session;
                return data;
        }

        SiUXNotifier.sendingFirstLog = true;

        data.id                 = SiUXNotifier.id;
        data.origin             = encodeURIComponent(SiUXNotifier.docLocOrigin)
        data.userIdent          = SiUXNotifier.userIdent;
        data.version            = SiUXNotifier.version;
        data.versionInline      = SiUXNotifier.versionInline;

        // add client data
        for (var clientDataKey in SiUXNotifier.clientData)
                if ( SiUXNotifier.clientData[clientDataKey] )
                        data[clientDataKey] = SiUXNotifier.clientData[clientDataKey];

        return data;
}

SiUXNotifier.logniCallback = function(retLogniAdd)
{
        if ( !SiUXNotifier.session && retLogniAdd['statusCode'] == 'OK' )
                SiUXNotifier.session = retLogniAdd.data.session;

        SiUXNotifier.sendingFirstLog = false;
}

SiUXNotifier.logni = function(msg, paramList, mask, depth, data, logList)
{
        var timerFirstLog = setInterval( function() {

                if ( !SiUXNotifier.sendingFirstLog ) {

                        if (logList)
                                data[0] = SiUXNotifier.setBasicData( data[0] );
                        else
                                data = SiUXNotifier.setBasicData(data);

                        log.ni(msg, paramList, mask, depth, data, SiUXNotifier.logniCallback)
                        clearTimeout(timerFirstLog);
                }
        }, 100);
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

        SiUXNotifier.logni(msgList, paramList, maskList, depthList, dataList, true);
}
