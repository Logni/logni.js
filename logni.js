function obj2str(obj)
{
        var parseArray = function(arr)
        {
                var a = [];

                for (var i=0; i<arr.length; i++) 
                       a.push( parse( arr[i] ) );
                
                return "[" + a.join(", ") + "]";
        }

        var parseObj = function(obj)
        {
                var a = [], t;

                for (var prop in obj) {
                        if ( obj.hasOwnProperty(prop) ) {
                                t = obj[prop];

                                if (!t)
                                        continue;

                                if (t instanceof Array)
                                        a[a.length] = [ prop + ": " + parseArray(t) ];

                                else if (typeof t == "object")
                                        a[a.length] = prop + ": " + parseObj(t);

                                else if (typeof t == "string")
                                        a[a.length] = [ prop + ": \"" + t.toString() + "\"" ];

                                else
                                        a[a.length] = [ prop + ": " + t.toString()];
                        }
                }
                return "{" + a.join(", ") + "}";
        }

        var parse = function(obj)
        {
                if (obj instanceof Array)
                        return parseArray(obj);

                else if (typeof obj == "object")
                        return parseObj(obj);

                else if (typeof obj == "string")
                        return "\"" + obj.toString() + "\"";

                else
                        return obj.toString();
        }

        return parse(obj);
}

var log = (function() {

        var _mask       = {'INFO':5, 'ERR':5, 'FATAL':5, 'DBG':5, 'WARN':5};
        var _file       = '';
        var _stderr     = 0;
        var _method     = 'GET';

        return {
                file: function(iFile)
                {
                        _file = iFile;
                },
                stderr: function(iStderr)
                {
                        _stderr = iStderr;
                },
                method: function(iMethod)
                {
                        _method = iMethod;
                },
                mask: function(iMask) 
                {
                        if (iMask == 'ALL') {
                                for (var prop in _mask) {
                                        _mask[prop] = 1;
                                }
                        }
                        else {
                                for(var i=0; i<iMask.length; i=i+2) {
                                        var maskChar = iMask.charAt(i);
                                        var maskDepth = parseInt( iMask.charAt(i+1) );

                                        var maskName = '';

                                        for (prop in _mask) {
                                                if (prop.charAt(0) == maskChar) {
                                                        maskName = prop;
                                                        break;
                                                }                                                
                                        }

                                        if (maskName == '')
                                                return;

                                        if ( !(maskDepth >= 1 && maskDepth <= 4) )
                                                return;
                                        
                                        _mask[maskName] = maskDepth;
                                }
                        }
                },
                ni: function(msg, paramList, mask, depth)
                {
                        var data = null;
                        if (arguments.length > 4)
                                data = arguments[4];

                        // send more logs at once
                        if (msg instanceof Array) {

                                if ( !(paramList instanceof Array) || !(mask instanceof Array) || !(depth instanceof Array) )
                                        return;

                                var msgCnt = msg.length;

                                if (data) {
                                        if ( !(data instanceof Array) )
                                                return;

                                        if (data.length != msgCnt)
                                                return;
                                }

                                if (paramList.length != msgCnt || mask.length != msgCnt || depth.length != msgCnt)
                                        return;
                        }
                        else {
                                msg             = [msg];
                                paramList       = [paramList];
                                mask            = [mask];
                                depth           = [depth];
                                data            = [data];
                        }

                        var reqData = [];

                        for (var i=0; i<msg.length; i++) {

                                itemMsg       = msg[i];
                                itemParamList = paramList[i];
                                itemMask      = mask[i];
                                itemDepth     = depth[i];
                                itemData      = data[i];

                                if (_mask[itemMask] == undefined)
                                        return;

                                if (_mask[itemMask] > itemDepth)
                                        return;

                                for (var j=0; j<itemParamList.length; j++) {
                                        if (itemMsg.indexOf("%s") == -1)
                                                break;

                                        msg[i] = itemMsg = itemMsg.replace(/%s/, obj2str( itemParamList[j] ) );
                                }

                                var dataPostfix = '';
                                if (msg.length > 1)
                                        dataPostfix = '_' + i.toString();

                                reqData.push( 'mask' + dataPostfix + '=' + itemMask );
                                reqData.push( 'depth' + dataPostfix + '=' + itemDepth );
                                reqData.push( 'msg' + dataPostfix + '=' +  encodeURIComponent(itemMsg) );

                                if (itemData) {
                                        for (var prop in itemData) {
                                                if ( itemData.hasOwnProperty(prop) ) {
                                                        reqData.push( encodeURIComponent(prop) + dataPostfix + "=" + encodeURIComponent( itemData[prop] ) );
                                                }
                                        }
                                }
                        }

                        if (_file != '') {
                                var xhr;  
                                  
                                if (typeof XMLHttpRequest !== 'undefined') 
                                        xhr = new XMLHttpRequest();
                                else {  
                                        var versions = ["Msxml2.XMLHTTP", "Msxml3.XMLHTTP", "Microsoft.XMLHTTP"]
                          
                                        for (var i=0; i<versions.length; i++) {  
                                                try {  
                                                        xhr = new ActiveXObject(versions[i]);  
                                                        break;  
                                                }  
                                                catch(e) {}
                                        }
                                }  
                                 
                                try { 
                                        xhr.onreadystatechange = function ensureReadiness()
                                        {  
                                                try {
                                                        if (xhr.readyState === 4 && xhr.status !== 200) {
                                                                try {
                                                                        for (var i=0; i<msg.length; i++) {
                                                                                console.log("ERR: log.ni('" + msg[i] + "', (" + paramList[i] + "), '" + mask[i] + "', " + depth[i] + "): " + xhr.status);
                                                                        }
                                                                } catch(e) {}
                                                                return; 
                                                        }
                                                        else {
                                                                //console.log(xhr.readyState);
                                                        }
                                                      
                                                        if (xhr.readyState === 4) {
                                                                //console.log( xhr.responseText );
                                                        }
                                                } catch(e) {}
                                        }  
                                        
                                        var xhrArgs = "?" + reqData.join("&");
                                        var xhrData = null;

                                        if (_method == 'POST') {
                                                xhrArgs = '';
                                                xhrData = reqData.join("&");
                                        }

                                        xhr.open(_method, _file + xhrArgs, true);  
                                        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                                        xhr.send(xhrData);
                                }
                                catch(e) {}
                        }

                        if (_stderr == 1) {
                                try {
                                        for (var i=0; i<msg.length; i++) {
                                                console.log(mask[i] + " = " + depth[i] + ": " + msg[i]);
                                        }
                                } catch(e) {}
                        }
                }
        };
})();
