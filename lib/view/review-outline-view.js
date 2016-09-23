"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var atom_space_pen_views_1 = require("atom-space-pen-views");
var atom_1 = require("atom");
var logger = require("../util/logger");
var review_runner_1 = require("../util/review-runner");
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
        }
        else {
            this.attach();
        }
    };
    ReVIEWOutlineView.prototype.attach = function () {
        var _this = this;
        this.storeFocusedElement();
        var editor = atom.workspace.getActiveTextEditor();
        var runner = new review_runner_1.default({ editor: editor });
        runner.on("report", function (_reports) {
            logger.log("Re:VIEW linter ReVIEWRunner compile");
            if (runner.lastSymbols) {
                var symbols = runner.lastSymbols.filter(function (symbol) { return symbol.symbolName === "hd"; });
                _this.setItems(symbols);
            }
            else {
                logger.log("not compiled...");
                atom.beep();
            }
        });
        runner.doCompile();
        atom_space_pen_views_1.$(atom.views.getView(atom.workspace)).append(this.jq); // TODO is this implementation on the right way?
        this.focusFilterEditor();
    };
    ReVIEWOutlineView.prototype.cancelled = function () {
        this.jq.remove();
    };
    ReVIEWOutlineView.prototype.viewForItem = function (symbol) {
        var repeatString = function (times, str, result) {
            if (result === void 0) { result = ""; }
            if (times === 0) {
                return result;
            }
            else {
                return repeatString(times - 1, str, result + str);
            }
        };
        var header = symbol.node;
        var prefix = repeatString(header.level, "=");
        var text = prefix + " " + symbol.labelName;
        return atom_space_pen_views_1.$$(function () {
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
        var pane = atom.workspace.getActivePane();
        if (!pane || typeof pane.getActiveEditor !== "function") {
            atom.beep();
            return;
        }
        var editor = pane.getActiveEditor();
        var point = atom_1.Point.fromObject({ row: symbol.node.location.start.line - 1, column: 0 });
        editor.setCursorBufferPosition(point);
    };
    return ReVIEWOutlineView;
}(atom_space_pen_views_1.SelectListView));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReVIEWOutlineView;
//# sourceMappingURL=review-outline-view.js.map