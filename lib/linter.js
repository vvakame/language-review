var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var Range = require("atom").Range;
var V = require("./util/const");
var ReVIEW = require("review.js");
var ReVIEWRunner = require("./util/review-runner");
var logger = require("./util/logger");
var linterPath = atom.packages.getLoadedPackage("linter").path;
var Linter = (function () {
    function Linter(editor) {
        this.editor = editor;
    }
    Linter = __decorate([
        replace(require(linterPath + "/lib/linter"))
    ], Linter);
    return Linter;
})();
var LinterReVIEW = (function (_super) {
    __extends(LinterReVIEW, _super);
    function LinterReVIEW(editor) {
        var _this = this;
        _super.call(this, editor);
        this.linterName = "Re:VIEW lint";
        this.reviewRunner = new ReVIEWRunner({ editor: this.editor });
        this.reviewRunner.on("report", function (reports) {
            logger.log("Re:VIEW linter ReVIEWRunner compile");
            _this.pendingReports = reports;
        });
        this.reviewRunner.startWatching();
    }
    LinterReVIEW.prototype.lintFile = function (filePath, callback) {
        var _this = this;
        if (!this.pendingReports) {
            callback([]);
            return;
        }
        callback(this.pendingReports
            .filter(function (report) { return report.level !== ReVIEW.ReportLevel.Info; })
            .map(function (report) {
            var level;
            switch (report.level) {
                case ReVIEW.ReportLevel.Error:
                    level = "error";
                    break;
                case ReVIEW.ReportLevel.Warning:
                    level = "warning";
                    break;
            }
            var range = _this.syntaxTreeToRange(report.nodes[0]);
            return {
                message: report.message,
                line: range.start.row + 1,
                range: range,
                level: level,
                linter: "Re:VIEW"
            };
        }));
    };
    LinterReVIEW.prototype.syntaxTreeToRange = function (node) {
        var range = Range.fromObject({
            start: {
                row: node.line - 1,
                column: node.column - 1
            },
            end: {
                row: node.line - 1,
                column: node.column - 1 + (node.endPos - node.offset)
            }
        });
        return range;
    };
    LinterReVIEW.syntax = [V.reviewScopeName];
    return LinterReVIEW;
})(Linter);
function replace(src) {
    return function () { return src; };
}
module.exports = LinterReVIEW;
//# sourceMappingURL=linter.js.map