"use strict";
/* tslint:disable:ban */
function isEnableOutput() {
    "use strict";
    return !!atom.config.get("language-review.debug");
}
function getCallSites(strip) {
    "use strict";
    if (strip === void 0) { strip = 2; }
    function MyError() {
        Error.captureStackTrace(this, MyError);
    }
    var oldPrepareStackTrace = Error.prepareStackTrace;
    var callSites;
    Error.prepareStackTrace = function (error, stack) {
        callSites = stack;
        return stack;
    };
    var obj = new MyError();
    obj.stack;
    Error.prepareStackTrace = oldPrepareStackTrace;
    for (var i = 0; i < strip; i++) {
        callSites.shift();
    }
    return callSites;
}
function logHelper(callback) {
    "use strict";
    var callSite = getCallSites(3)[0];
    var label;
    var functionName = callSite.getFunctionName();
    if (functionName) {
        label = functionName;
    }
    else {
        var fileName = callSite.getFileName();
        label = fileName.substr(fileName.lastIndexOf("/") + 1);
        label += ":" + callSite.getLineNumber() + ":" + callSite.getColumnNumber();
    }
    console.group(label);
    console.log([callSite.getFileName(), callSite.getLineNumber(), callSite.getColumnNumber()]);
    callback();
    console.groupEnd();
}
/* tslint:disable:no-unused-variable */
function log() {
    "use strict";
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    if (isEnableOutput()) {
        logHelper(function () {
            console.log.apply(console, args);
        });
    }
}
exports.log = log;
function warn() {
    "use strict";
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    if (isEnableOutput()) {
        logHelper(function () {
            console.warn.apply(console, args);
        });
    }
}
exports.warn = warn;
function error() {
    "use strict";
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    if (isEnableOutput()) {
        logHelper(function () {
            console.error.apply(console, args);
        });
    }
}
exports.error = error;
//# sourceMappingURL=logger.js.map