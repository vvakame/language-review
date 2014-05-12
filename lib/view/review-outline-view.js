/// <reference path="../../typings/atom/atom.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />
var _atom = require("atom");

var $$ = _atom.$$;

var ReVIEWOutlineView = (function (_super) {
    __extends(ReVIEWOutlineView, _super);
    function ReVIEWOutlineView() {
        _super.call(this);
        this.jq.addClass("review-outline overlay from-top");
    }
    ReVIEWOutlineView.activate = function () {
        new ReVIEWOutlineView();
    };

    Object.defineProperty(ReVIEWOutlineView.prototype, "jq", {
        get: function () {
            // dirty hack
            return this;
        },
        enumerable: true,
        configurable: true
    });

    ReVIEWOutlineView.prototype.getFilterKey = function () {
        return "labelName";
    };

    ReVIEWOutlineView.prototype.toggle = function () {
        if (this.jq.hasParent()) {
            this.cancel();
        } else {
            this.attach();
        }
    };

    ReVIEWOutlineView.prototype.attach = function () {
        this.storeFocusedElement();

        var symbols = [];

        var view = atom.workspaceView.getActiveView();
        if (view && view.reviewResultView && view.reviewResultView.reviewRunner) {
            var runner = view.reviewResultView.reviewRunner;
            if (runner.lastSymbols) {
                symbols = runner.lastSymbols.filter(function (symbol) {
                    return symbol.symbolName === "hd";
                });
            } else {
                console.log("not compiled...");
                atom.beep();
            }
        } else {
            console.log("unknown state... ", view);
            atom.beep();
            debugger;
        }

        this.setItems(symbols);
        atom.workspaceView.append(this.jq);
        this.focusFilterEditor();
    };

    ReVIEWOutlineView.prototype.viewForItem = function (symbol) {
        var repeatString = function (times, str, result) {
            if (typeof result === "undefined") { result = ""; }
            if (times === 0) {
                return result;
            } else {
                return repeatString(times - 1, str, result + str);
            }
        };

        var header = symbol.node;
        var prefix = repeatString(header.level, "=");
        var text = prefix + " " + symbol.labelName;

        return $$(function () {
            var _this = this;
            // this eq View(class)
            this.li(function () {
                _this.span(text);
            });
        });
    };

    ReVIEWOutlineView.prototype.confirmed = function (symbol) {
        // onSelected的な
        this.cancel();

        // emit したい…
        var view = atom.workspaceView.getActiveView();
        if (!view || typeof view.getEditor !== "function") {
            atom.beep();
            return;
        }
        var editor = view.getEditor();
        var point = _atom.Point.fromObject({ row: symbol.node.line - 1, column: 0 });
        editor.setCursorScreenPosition(point);
    };
    return ReVIEWOutlineView;
})(_atom.SelectListView);

module.exports = ReVIEWOutlineView;
//# sourceMappingURL=review-outline-view.js.map
