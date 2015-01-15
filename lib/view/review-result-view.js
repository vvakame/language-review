/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/pathwatcher/pathwatcher.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />
// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-view.coffee
var _atom = require("atom");
var V = require("../util/const");
var logger = require("../util/logger");
var ReVIEWRunner = require("../util/review-runner");
var ViolationView = require("./violation-view");
var ReVIEWResultView = (function (_super) {
    __extends(ReVIEWResultView, _super);
    function ReVIEWResultView(editorView) {
        var _this = this;
        _super.call(this);
        this.editorView = editorView;
        this.violationViews = [];
        this.editorView.reviewResultView = this;
        this.editorView.overlayer.append(this.jq);
        this.editor = this.editorView.getEditor();
        this.reviewRunner = new ReVIEWRunner({ editor: this.editorView.getEditor() });
        this.reviewRunner.on("activate", function () {
            logger.log("ReVIEWResultView ReVIEWRunner activate");
            _this.onCompileStarted();
        });
        this.reviewRunner.on("deactivate", function () {
            logger.log("ReVIEWResultView ReVIEWRunner deactivate");
            _this.onCompileSuspended();
        });
        this.reviewRunner.on("report", function (reports) {
            logger.log("ReVIEWResultView ReVIEWRunner compile");
            _this.onCompileResult(reports);
        });
        this.reviewRunner.startWatching();
        this.editorView.command(V.protocol + "move-to-next-violation", function () { return _this.moveToNextViolation(); });
        this.editorView.command(V.protocol + "move-to-previous-violation", function () { return _this.moveToPreviousViolation(); });
    }
    ReVIEWResultView.content = function () {
        return this.div({ class: "review-compile" });
    };
    Object.defineProperty(ReVIEWResultView.prototype, "jq", {
        get: function () {
            // dirty hack
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ReVIEWResultView.prototype.beforeRemove = function () {
        logger.log();
        this.removeViolationViews();
        this.reviewRunner.stopWatching();
    };
    ReVIEWResultView.prototype.refresh = function () {
        logger.log();
    };
    ReVIEWResultView.prototype.onCompileStarted = function () {
        var _this = this;
        this.editorDisplayUpdateSubscription = this.subscribe(this.editorView, "editor:display-updated", function () {
            if (_this.pendingReports) {
                _this.addViolationViews(_this.pendingReports);
                _this.pendingReports = null;
            }
        });
    };
    ReVIEWResultView.prototype.onCompileSuspended = function () {
        if (this.editorDisplayUpdateSubscription) {
            this.editorDisplayUpdateSubscription.off();
            this.editorDisplayUpdateSubscription = null;
        }
        this.removeViolationViews();
    };
    ReVIEWResultView.prototype.onCompileResult = function (reports) {
        this.removeViolationViews();
        if (this.editorView.active) {
            this.addViolationViews(reports);
        }
        else {
            this.pendingReports = reports;
        }
    };
    ReVIEWResultView.prototype.addViolationViews = function (reports) {
        var _this = this;
        reports.forEach(function (report) {
            var violationView = new ViolationView(_this, report);
            _this.violationViews.push(violationView);
        });
    };
    ReVIEWResultView.prototype.removeViolationViews = function () {
        this.violationViews.forEach(function (violationView) {
            violationView.jq.remove();
        });
        this.violationViews = [];
    };
    ReVIEWResultView.prototype.moveToNextViolation = function () {
        this.moveToOtherViolation(function (a, b) { return a.isGreaterThan(b); }, function (values) { return values.shift(); });
    };
    ReVIEWResultView.prototype.moveToPreviousViolation = function () {
        this.moveToOtherViolation(function (a, b) { return a.isLessThan(b); }, function (values) { return values.pop(); });
    };
    ReVIEWResultView.prototype.moveToOtherViolation = function (comparator, getOne) {
        if (this.violationViews.length === 0) {
            atom.beep();
            return;
        }
        var currentCursorPosition = this.editor.getCursor().getScreenPosition();
        var neighborViolationViews = this.violationViews.filter(function (violationView) {
            var violationPosition = violationView.screenStartPosition;
            return comparator(violationPosition, currentCursorPosition);
        });
        var neighborViolationView = getOne(neighborViolationViews);
        if (neighborViolationView) {
            this.editor.setCursorScreenPosition(neighborViolationView.screenStartPosition);
        }
        else {
            atom.beep();
        }
    };
    return ReVIEWResultView;
})(_atom.View);
module.exports = ReVIEWResultView;
//# sourceMappingURL=review-result-view.js.map