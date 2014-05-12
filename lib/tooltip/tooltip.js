/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
var _atom = require("atom");

var vm = require("vm");
var fs = require("fs");

var fileName = __dirname + "/../../bower-task/main-js/bootstrap/tooltip.js";
var code = fs.readFileSync(fileName, { encoding: "utf-8" });

var sandbox = {
    jQuery: _atom.$,
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window)
};
vm.runInNewContext(code, sandbox, "tooltip.js");

exports.jQuery = sandbox.jQuery;
exports.$ = sandbox.jQuery;

// TypeScriptコンパイラの制約回避
vm.runInNewContext("Tooltip = $.fn.tooltip.Constructor;", module.exports, "adhoc.vm");
//# sourceMappingURL=tooltip.js.map
