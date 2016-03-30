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

        var _mask = {'INFO':5, 'ERR':5, 'FATAL':5, 'DBG':5, 'WARN':5};
        var _file = '';
        var _stderr = 0;

        return {
                file: function(iFile)
                {
                        _file = iFile;
                },
                stderr: function(iStderr)
                {
                        _stderr = iStderr;
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
                        if (_mask[mask] == undefined)
                                return;

                        if (_mask[mask] > depth)
                                return;

                        /*
                        console.log(mask);
                        console.log(depth);
                        console.log(paramList);
                        console.log(_file);
                        */

                        for (var i=0; i<paramList.length; i++) {
                                if (msg.indexOf("%s") == -1)
                                        break;

                                msg = msg.replace(/%s/, obj2str( paramList[i] ) );
                        }

                        if (_file != '') {
                                var xhr;  
                                  
                                if (typeof XMLHttpRequest !== 'undefined') 
                                        xhr = new XMLHttpRequest();
                                else {  
                                        var versions = ["MSXML2.XmlHttp.5.0",   
                                                        "MSXML2.XmlHttp.4.0",  
                                                        "MSXML2.XmlHttp.3.0",   
                                                        "MSXML2.XmlHttp.2.0",  
                                                        "Microsoft.XmlHttp"]  
                          
                                        for (var i = 0, len = versions.length; i < len; i++) {  
                                                try {  
                                                        xhr = new ActiveXObject(versions[i]);  
                                                        break;  
                                                }  
                                                catch(e) {}  
                                        }
                                }  
                                  
                                xhr.onreadystatechange = function ensureReadiness()
                                {  
                                        if (xhr.readyState == 4 && xhr.status !== 200) {
                                                console.log("ERR: log.ni('" + msg + "', (" + paramList + "), '" + mask + "', " + depth + "): " + xhr.status);
                                                return; 
                                        }
                                        else {
                                                //console.log(xhr.readyState);
                                        }
                                      
                                        if (xhr.readyState === 4) {  
                                                //console.log( xhr.responseText );
                                        }             
                                }  
                                
                                //console.log(logUrl + "?mask=" + mask + "&depth=" + depth + "&msg=" + encodeURIComponent(msg)) ;

                                xhr.open('GET', _file + "?mask=" + mask + "&depth=" + depth + "&msg=" + encodeURIComponent(msg), true);  
                                xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                                xhr.send();
                        }

                        if (_stderr == 1) {
                                console.log(mask + " = " + depth + ": " + msg);
                        }
                }
        };
})();
