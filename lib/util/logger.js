/* tslint:disable:ban */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function isEnableOutput() {
    return !!atom.config.get("language-review.debug");
}
function getCallSites(strip) {
    if (strip === void 0) { strip = 2; }
    var MyError = (function (_super) {
        __extends(MyError, _super);
        function MyError() {
            _super.call(this);
            Error.captureStackTrace(this, MyError);
        }
        return MyError;
    }(Error));
    var oldPrepareStackTrace = Error.prepareStackTrace;
    var callSites;
    Error.prepareStackTrace = function (_error, stack) {
        callSites = stack;
        return stack;
    };
    new MyError().stack;
    Error.prepareStackTrace = oldPrepareStackTrace;
    if (!callSites) {
        // NOTE https://github.com/atom/atom/pull/9181
        // Error.prepareStackTrace が上書きできない
        return null;
    }
    for (var i = 0; i < strip; i++) {
        callSites.shift();
    }
    return callSites;
}
function logHelper(callback) {
    var callSites = getCallSites(3);
    if (callSites) {
        var callSite = callSites[0];
        var label = void 0;
        var functionName = callSite.getFunctionName();
        if (functionName) {
            label = functionName;
        }
        else {
            var fileName = callSite.getFileName();
            label = fileName.substr(fileName.lastIndexOf("/") + 1) + ":" + callSite.getLineNumber() + ":" + callSite.getColumnNumber();
        }
        console.group(label);
        console.log([callSite.getFileName(), callSite.getLineNumber(), callSite.getColumnNumber()]);
        callback();
        console.groupEnd();
    }
    else {
        callback();
    }
}
/* tslint:disable:no-unused-variable */
function log() {
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
/* tslint:enable:ban no-unused-variable */
//# sourceMappingURL=logger.js.map