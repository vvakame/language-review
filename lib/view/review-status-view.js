/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/emissary/emissary.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />
// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-status-view.coffee
var _atom = require("atom");

var ReVIEW = require("review.js");

var V = require("../util/const");

var ReVIEWStatusView = (function (_super) {
    __extends(ReVIEWStatusView, _super);
    function ReVIEWStatusView(statusBarView) {
        var _this = this;
        _super.call(this);
        this.statusBarView = statusBarView;

        this.subscribeToReVIEWRunner();
        this.update();

        this.subscribe(this.statusBarView, "active-buffer-changed", function () {
            _this.unsubscribeFromReVIEWRunner();
            _this.subscribeToReVIEWRunner();
            _this.update();
        });
    }
    ReVIEWStatusView.content = function () {
        var _this = this;
        return this.div({ class: "review-status inline-block" }, function () {
            _this.span({ class: "review-name" });
            _this.span({ class: "review-summary" });
        });
    };

    Object.defineProperty(ReVIEWStatusView.prototype, "jq", {
        get: function () {
            // dirty hack
            return this;
        },
        enumerable: true,
        configurable: true
    });

    ReVIEWStatusView.prototype.getActiveReVIEWRunner = function () {
        var editorView = atom.workspaceView.getActiveView();
        if (!editorView) {
            // EditorView1つも開いてないパターン
            return null;
        }
        var reviewResultView = editorView.reviewResultView;
        if (reviewResultView && reviewResultView.reviewRunner) {
            return reviewResultView.reviewRunner;
        } else {
            return null;
        }
    };

    ReVIEWStatusView.prototype.subscribeToReVIEWRunner = function () {
        var _this = this;
        var activeRunner = this.getActiveReVIEWRunner();
        if (!activeRunner) {
            return;
        }
        this.subscription = activeRunner.on("activate deactivate compile", function (reports) {
            _this.update(reports);
        });
    };

    ReVIEWStatusView.prototype.unsubscribeFromReVIEWRunner = function () {
        if (this.subscription) {
            this.subscription.off();
        }
        this.subscription = null;
    };

    ReVIEWStatusView.prototype.update = function (reports) {
        var view = this.statusBarView.getActiveItem();
        var grammarName;
        if (view && typeof view.getGrammar === "function") {
            grammarName = view.getGrammar().scopeName;
        }
        if (V.reviewScopeName === grammarName) {
            this.displayName("Re:VIEW");
            if (!reports) {
                // 他のファイルの編集から戻ってきた時 active-buffer-changed
                reports = this.getActiveReVIEWRunner().lastReports;
            }
            this.displaySummary(reports);
        } else {
            // Re:VIEW文書じゃないのでサクっと非表示
            this.displayName();
            this.displaySummary();
        }
    };

    ReVIEWStatusView.prototype.displayName = function (text) {
        if (typeof text === "undefined") { text = ""; }
        this.jq.find(".review-name").text(text);
    };

    ReVIEWStatusView.prototype.displaySummary = function (reports) {
        var countReport = function (level, reports) {
            if (typeof reports === "undefined") { reports = []; }
            return reports.filter(function (report) {
                return report.level === level;
            }).length;
        };

        var html = "";
        if (reports) {
            if (reports.length === 0) {
                html += "<span class=\"icon icon-check review-clean\"></span>";
            } else {
                var errorCount = countReport(2 /* Error */, reports);
                if (errorCount > 0) {
                    html += "<span class=\"icon icon-alert review-error\">" + errorCount + "</span>";
                }
                var warningCount = countReport(1 /* Warning */, reports);
                if (warningCount > 0) {
                    html += "<span class=\"icon icon-alert review-warning\">" + warningCount + "</span>";
                }
                var infoCount = countReport(0 /* Info */, reports);
                if (infoCount > 0) {
                    html += "<span class=\"icon icon-alert review-info\">" + infoCount + "</span>";
                }
            }
        }

        this.jq.find(".review-summary").html(html);
    };
    return ReVIEWStatusView;
})(_atom.View);

module.exports = ReVIEWStatusView;
//# sourceMappingURL=review-status-view.js.map
