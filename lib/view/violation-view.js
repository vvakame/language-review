/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/text-buffer/text-buffer.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />
// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/violation-view.coffee
var _atom = require("atom");
var $ = _atom.$;
var _TextBuffer = require("text-buffer");

var ReVIEW = require("review.js");

var ViolationTooltip = require("../tooltip/validation-tooltip");

var ViolationView = (function (_super) {
    __extends(ViolationView, _super);
    function ViolationView(resultView, report) {
        _super.call(this);
        this.resultView = resultView;
        this.report = report;

        this.resultView.jq.append(this.jq);

        this.editorView = resultView.editorView;
        this.editor = resultView.editor;

        this.initializeSubviews();
        this.initializeStatus();

        this.prepareTooltip();
        this.trackEdit();
        this.trackCursor();
        this.showHighlight();
        this.toggleTooltipWithCursorPosition();
    }
    ViolationView.content = function () {
        var _this = this;
        return this.div({ class: "violation" }, function () {
            _this.div({ class: "violation-arrow" });
            _this.div({ class: "violation-area" });
        });
    };

    Object.defineProperty(ViolationView.prototype, "jq", {
        get: function () {
            // dirty hack
            return this;
        },
        enumerable: true,
        configurable: true
    });

    ViolationView.prototype.initializeSubviews = function () {
        this.$arrow = this.jq.find(".violation-arrow");
        this.$arrow.addClass("violation-" + ReVIEW.ReportLevel[this.report.level].toLowerCase());

        this.$area = this.jq.find(".violation-area");
        this.$area.addClass("violation-" + ReVIEW.ReportLevel[this.report.level].toLowerCase());
    };

    ViolationView.prototype.initializeStatus = function () {
        var node = this.report.nodes[0];
        var screenRange = this.editor.screenRangeForBufferRange(this.syntaxTreeToRange(node));
        this.screenStartPosition = screenRange.start;
        this.screenEndPosition = screenRange.end;

        this.isValid = true;
    };

    ViolationView.prototype.syntaxTreeToRange = function (node) {
        var range = _TextBuffer.Range.fromObject({
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

    ViolationView.prototype.prepareTooltip = function () {
        var _this = this;
        this.jq.each(function (index, element) {
            var $this = $(element);
            var data = new ViolationTooltip(_this.editorView, element, {
                title: _this.report.message,
                html: false,
                container: _this.resultView,
                selector: _this.jq.find(".violation-area")
            });
            $this.data("bs.tooltip", data);
        });
    };

    ViolationView.prototype.trackEdit = function () {
        var _this = this;
        var options = { invalidation: "inside", persistent: false };
        this.marker = this.editor.markScreenRange(this.getCurrentScreenRange(), options);
        var klass = "review-" + ReVIEW.ReportLevel[this.report.level].toLowerCase();
        this.editor.decorateMarker(this.marker, { type: "gutter", class: klass });
        this.marker.on("changed", function (event) {
            _this.screenStartPosition = event.newTailScreenPosition;
            _this.screenEndPosition = event.newHeadScreenPosition;
            _this.isValid = event.isValid;

            if (_this.isValid) {
                if (_this.isVisibleMarkerChange(event)) {
                    setImmediate(function () {
                        _this.showHighlight();
                        _this.toggleTooltipWithCursorPosition();
                    });
                } else {
                    _this.jq.hide();
                    // TODO 500㍉秒毎になんかするっぽい
                }
            } else {
                _this.hideHighlight();
                _this.tooltipHide();
            }
        });
    };

    ViolationView.prototype.isVisibleMarkerChange = function (event) {
        var editorFirstVisibleRow = this.editorView.getFirstVisibleScreenRow();
        var editorLastVisibleRow = this.editorView.getLastVisibleScreenRow();
        return [event.oldTailScreenPosition, event.newTailScreenPosition].some(function (position) {
            return editorFirstVisibleRow <= position.row && position.row <= editorLastVisibleRow;
        });
    };

    ViolationView.prototype.trackCursor = function () {
        var _this = this;
        this.subscribe(this.editor.getCursor(), "moved", function () {
            if (_this.isValid) {
                _this.toggleTooltipWithCursorPosition();
            } else {
                _this.tooltipHide();
            }
        });
    };

    ViolationView.prototype.showHighlight = function () {
        this.updateHighlight();
        this.jq.show();
    };

    ViolationView.prototype.hideHighlight = function () {
        this.jq.hide();
    };

    ViolationView.prototype.updateHighlight = function () {
        var startPixelPosition = this.editorView.pixelPositionForScreenPosition(this.screenStartPosition);
        var endPixelPosition = this.editorView.pixelPositionForScreenPosition(this.screenEndPosition);
        var arrowSize = this.editorView.charWidth / 2;
        var verticalOffset = this.editorView.lineHeight + Math.floor(arrowSize / 4);

        this.jq.css({
            top: startPixelPosition.top,
            left: startPixelPosition.left,
            width: this.editorView.charWidth - (this.editorView.charWidth % 2),
            height: verticalOffset
        });

        this.$arrow.css({
            "border-right-width": arrowSize,
            "border-bottom-width": arrowSize,
            "border-left-width": arrowSize
        });

        var borderOffset = arrowSize / 2;
        this.$area.css({
            left: borderOffset,
            width: endPixelPosition.left - startPixelPosition.left - borderOffset,
            height: verticalOffset
        });
        if (this.screenEndPosition.column - this.screenStartPosition.column > 1) {
            this.$area.addClass("violation-border");
        } else {
            this.$area.removeClass("violation-border");
        }
    };

    ViolationView.prototype.toggleTooltipWithCursorPosition = function () {
        var cursorPosition = this.editor.getCursor().getScreenPosition();

        if (cursorPosition.row === this.screenStartPosition.row && cursorPosition.column === this.screenStartPosition.column) {
            this.tooltipShow();
        } else {
            this.tooltipHide();
        }
    };

    ViolationView.prototype.getCurrentBufferStartPosition = function () {
        return this.editor.bufferPositionForScreenPosition(this.screenStartPosition);
    };

    ViolationView.prototype.getCurrentScreenRange = function () {
        return new _TextBuffer.Range(this.screenStartPosition, this.screenEndPosition);
    };

    ViolationView.prototype.tooltipShow = function () {
        this.operateTooltip(function (tooltip) {
            return tooltip.show();
        });
    };

    ViolationView.prototype.tooltipHide = function () {
        this.operateTooltip(function (tooltip) {
            return tooltip.hide();
        });
    };

    ViolationView.prototype.tooltipDestroy = function () {
        this.operateTooltip(function (tooltip) {
            return tooltip.destroy();
        });
    };

    ViolationView.prototype.operateTooltip = function (operation) {
        this.jq.each(function (index, element) {
            var data = $(element).data("bs.tooltip");
            operation(data);
        });
    };

    ViolationView.prototype.beforeRemove = function () {
        if (this.marker) {
            this.marker.destroy();
        }
        this.tooltipDestroy();
    };
    return ViolationView;
})(_atom.View);

module.exports = ViolationView;
//# sourceMappingURL=violation-view.js.map
