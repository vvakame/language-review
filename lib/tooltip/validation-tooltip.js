/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tooltip = require("./tooltip");
var $ = tooltip.$;
var color = require("color");
var ViolationTooltip = (function (_super) {
    __extends(ViolationTooltip, _super);
    function ViolationTooltip(editorView, element, options) {
        _super.call(this, element, options);
        this.editorView = editorView;
    }
    ViolationTooltip.prototype.getDefaults = function () {
        return ViolationTooltip.DEFAULTS;
    };
    ViolationTooltip.prototype.show = function () {
        var e = $.Event("show.bs." + this.type);
        if (this.hasContent() && this.enabled) {
            this.$element.trigger(e);
            if (e.isDefaultPrevented()) {
                return;
            }
            var $tip = this.tip();
            var title = this.getTitle();
            $tip.find(".tooltip-inner")[this.options.html ? "html" : "text"](title);
            $tip.removeClass("fade in top-left top-right bottom-left bottom-right");
            if (this.options.animation) {
                $tip.addClass("fade");
            }
            var placement;
            if (typeof this.options.placement === "function") {
                placement = this.options.placement.call(this, $tip[0], this.$element[0]);
            }
            else {
                placement = this.options.placement;
            }
            var autoToken = /\s?auto?\s?/i;
            var autoPlace = autoToken.test(placement);
            if (autoToken.test(placement)) {
                placement = placement.replace(autoToken, "") || "bottom-right";
            }
            $tip
                .detach()
                .css({ top: 0, left: 0, display: "block" })
                .addClass(placement);
            if (this.options.container) {
                $tip.appendTo(this.options.container);
            }
            else {
                $tip.insertAfter(this.$element);
            }
            var pos = this.getPosition();
            var actualWidth = $tip[0].offsetWidth;
            var actualHeight = $tip[0].offsetHeight;
            if (autoPlace) {
                var orgPlacement = placement;
                placement = this.autoPlace(orgPlacement, actualWidth, actualHeight);
                $tip
                    .removeClass(orgPlacement)
                    .addClass(placement);
            }
            var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);
            this.applyPlacement(calculatedOffset, placement);
            this.hoverState = null;
        }
        this.applyAdditionalStyle();
    };
    ViolationTooltip.prototype.autoPlace = function (orgPlacement, actualWidth, actualHeight) {
        var $editor = this.getEditorUnderLayer();
        var editorWidth = $editor.outerWidth();
        var editorHeight = $editor.outerHeight();
        var editorLeft = $editor.offset().left;
        var pos = this.getLogicalPosition();
        var placement = orgPlacement.split("-");
        if (placement[0] === "bottom" && (pos.top + pos.height + actualHeight > editorHeight)) {
            placement[0] = "top";
        }
        else if (placement[0] === "top" && (pos.top - actualHeight < 0)) {
            placement[0] = "bottom";
        }
        if (placement[1] === "right" && (pos.right + actualWidth > editorWidth)) {
            placement[1] = "left";
        }
        else if (placement[1] === "left" && (pos.left - actualWidth < editorLeft)) {
            placement[1] = "right";
        }
        return placement.join("-");
    };
    ViolationTooltip.prototype.applyPlacement = function (offset, placement) {
        var replace;
        var $tip = this.tip();
        var width = $tip[0].offsetWidth;
        var height = $tip[0].offsetHeight;
        // manually read margins because getBoundingClientRect includes difference
        var marginTop = parseInt($tip.css("margin-top"), 10);
        var marginLeft = parseInt($tip.css("margin-left"), 10);
        // we must check for NaN for ie 8/9
        if (isNaN(marginTop)) {
            marginTop = 0;
        }
        if (isNaN(marginLeft)) {
            marginLeft = 0;
        }
        offset.top = offset.top + marginTop;
        offset.left = offset.left + marginLeft;
        // $.fn.offset doesn't round pixel values
        // so we use setOffset directly with our own function B-0
        $.offset.setOffset($tip[0], $.extend({
            using: function (props) {
                $tip.css({
                    top: Math.round(props.top),
                    left: Math.round(props.left)
                });
            }
        }, offset), 0);
        $tip.addClass("in");
        // check to see if placing tip in new offset caused the tip to resize itself
        var actualWidth = $tip[0].offsetWidth;
        var actualHeight = $tip[0].offsetHeight;
        if (placement === "top" && actualHeight !== height) {
            replace = true;
            offset.top = offset.top + height - actualHeight;
        }
        if (/bottom|top/.test(placement)) {
            var delta = 0;
            if (offset.left < 0) {
                delta = offset.left * -2;
                offset.left = 0;
                $tip.offset(offset);
                actualWidth = $tip[0].offsetWidth;
                actualHeight = $tip[0].offsetHeight;
            }
            this.replaceArrow(delta - width + actualWidth, actualWidth, "left");
        }
        else {
            this.replaceArrow(actualHeight - height, actualHeight, "top");
        }
        if (replace) {
            $tip.offset(offset);
        }
    };
    ViolationTooltip.prototype.getLogicalPosition = function () {
        var el = this.$element[0];
        var position = this.$element.position();
        position.width = el.offsetWidth;
        position.height = el.offsetHeight;
        position.right = position.left + position.width;
        position.bottom = position.top + position.height;
        return position;
    };
    ViolationTooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
        switch (placement) {
            case "bottom-right":
                return {
                    top: pos.top + pos.height,
                    left: pos.left + pos.width / 2
                };
            case "top-right":
                return {
                    top: pos.top - actualHeight,
                    left: pos.left + pos.width / 2
                };
            case "bottom-left":
                return {
                    top: pos.top + pos.height,
                    left: pos.left + pos.width / 2 - actualWidth
                };
            case "top-left":
                return {
                    top: pos.top - actualHeight,
                    left: pos.left + pos.width / 2 - actualWidth
                };
        }
    };
    ViolationTooltip.prototype.applyAdditionalStyle = function () {
        var $tip = this.tip();
        var editorBackgroundColor = color(this.getEditorViewAsJQuery().css("background-color"));
        var shadow = "0 0 3px " + editorBackgroundColor.clearer(0.1).rgbaString();
        $tip.find(".tooltip-inner").css("box-shadow", shadow);
        var $code = $tip.find(".tooltip-inner code, pre");
        if ($code.length > 0) {
            var frontColor = color($tip.find(".tooltip-inner").css("color"));
            $code.css("color", frontColor.clone().rgbaString());
            $code.css("background-color", frontColor.clone().clearer(0.96).rgbaString());
            $code.css("border-color", frontColor.clone().clearer(0.86).rgbaString());
        }
    };
    ViolationTooltip.prototype.getEditorUnderLayer = function () {
        if (!this.editorUnderlayer) {
            this.editorUnderlayer = this.getEditorViewAsJQuery().find(".underlayer");
        }
        return this.editorUnderlayer;
    };
    ViolationTooltip.prototype.getEditorView = function () {
        return this.editorView;
    };
    ViolationTooltip.prototype.getEditorViewAsJQuery = function () {
        // adhoc TypeScriptの制約としてJQueryを辛くなく継承する方法わからなかったので…
        return this.editorView;
    };
    ViolationTooltip.DEFAULTS = $.extend({}, tooltip.Tooltip.DEFAULTS, { placement: "bottom-right auto" });
    return ViolationTooltip;
})(tooltip.Tooltip);
module.exports = ViolationTooltip;
//# sourceMappingURL=validation-tooltip.js.map