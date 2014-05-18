"use strict";
/* tslint:disable:ban */
function isEnableOutput() {
    "use strict";

    return !!atom.config.get("language-review.debug");
}

function log() {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 0); _i++) {
        args[_i] = arguments[_i + 0];
    }
    "use strict";

    if (isEnableOutput()) {
        console.log.apply(console, arguments);
    }
}
exports.log = log;

function warn() {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 0); _i++) {
        args[_i] = arguments[_i + 0];
    }
    "use strict";

    if (isEnableOutput()) {
        console.warn.apply(console, arguments);
    }
}
exports.warn = warn;

function error() {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 0); _i++) {
        args[_i] = arguments[_i + 0];
    }
    "use strict";

    if (isEnableOutput()) {
        console.error.apply(console, arguments);
    }
}
exports.error = error;
/* tslint:enable:ban */
//# sourceMappingURL=logger.js.map
