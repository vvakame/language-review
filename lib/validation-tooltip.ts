/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />

// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/violation-tooltip.coffee

import vm = require("vm");

import tooltip = require("./tooltip");
var $ = tooltip.$;

var color = require("color");

// TypeScriptコンパイラの制約回避
vm.runInNewContext("Tooltip = $.fn.tooltip.Constructor;", tooltip, "adhoc.vm");

import V = require("./const");
import ViolationView = require("./violation-view");

class ViolationTooltip extends tooltip.Tooltip {
	static DEFAULTS:tooltip.IViolationTooltipOptions = $.extend({}, tooltip.Tooltip.DEFAULTS, { placement: "bottom-right auto" });

	editorUnderlayer:JQuery;

	constructor(public violationView:ViolationView, element:HTMLElement, options:tooltip.IViolationTooltipOptions) {
		super(element, options);
	}

	getDefaults() {
		return ViolationTooltip.DEFAULTS;
	}

	show() {
		var e = $.Event("show.bs." + this.type);

		if (this.hasContent() && this.enabled) {
			this.$element.trigger(e);

			if (e.isDefaultPrevented()) {
				return;
			}

			var that = this;

			var $tip = this.tip();

			this.setContent();

			if (this.options.animation) {
				$tip.addClass("fade");
			}

			var placement = typeof this.options.placement == "function" ?
				this.options.placement.call(this, $tip[0], this.$element[0]) :
				this.options.placement;

			var autoToken = /\s?auto?\s?/i;
			var autoPlace = autoToken.test(placement);
			if (autoPlace) {
				placement = placement.replace(autoToken, "") || "bottom-right";
			}

			$tip
				.detach()
				.css({ top: 0, left: 0, display: "block" })
				.addClass(placement);

			if (this.options.container) {
				$tip.appendTo(this.options.container);
			} else {
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
	}

	autoPlace(orgPlacement:string, actualWidth:number, actualHeight:number):string {
		var $editor = this.getEditorUnderLayer();
		var editorWidth = $editor.outerWidth();
		var editorHeight = $editor.outerHeight();
		var editorLeft = $editor.offset().left;

		var pos = this.getLogicalPosition();

		var placement = orgPlacement.split("-");

		if (placement[0] == "bottom" && (pos.top + pos.height + actualHeight > editorHeight)) {
			placement[0] = "top";
		} else if (placement[0] == "top" && (pos.top - actualHeight < 0)) {
			placement[0] = "bottom";
		}
		if (placement[1] == "right" && (pos.right + actualWidth > editorWidth)) {
			placement[1] = "left";
		} else if (placement[1] == "left" && (pos.left - actualWidth < editorLeft)) {
			placement[1] = "right";
		}

		return placement.join("-");
	}

	applyPlacement(offset:any, placement:any):void {
		var replace:boolean;
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
		(<any>$).offset.setOffset($tip[0], $.extend({
			using: (props:any) => {
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

		if (placement == "top" && actualHeight != height) {
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
		} else {
			this.replaceArrow(actualHeight - height, actualHeight, "top");
		}

		if (replace) {
			$tip.offset(offset);
		}
	}

	setContent() {
		var $tip = this.tip();
		var title = this.getTitle();

		$tip.find(".tooltip-inner")[this.options.html ? "html" : "text"](title);
		$tip.removeClass("fade in top-left top-right bottom-left bottom-right");
	}

	getLogicalPosition():{left: number; top:number; width:number; height: number; right: number; bottom:number;} {
		var el = this.$element[0];
		var position:any = this.$element.position();
		position.width = el.offsetWidth;
		position.height = el.offsetHeight;
		position.right = position.left + position.width;
		position.bottom = position.top + position.height;
		return position;
	}

	getCalculatedOffset(placement:any, pos:any, actualWidth:number, actualHeight:number):{top:number;left:number;} {
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
	}

	applyAdditionalStyle() {
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
	}

	getEditorUnderLayer():JQuery {
		if (!this.editorUnderlayer) {
			this.editorUnderlayer = this.getEditorViewAsJQuery().find(".underlayer");
		}
		return this.editorUnderlayer;
	}

	getEditorView():V.IReVIEWedEditorView {
		return this.violationView.resultView.editorView;
	}

	getEditorViewAsJQuery():JQuery {
		// adhoc TypeScriptの制約としてJQueryを辛くなく継承する方法わからなかったので…
		return <any>this.violationView.resultView.editorView;
	}
}

export = ViolationTooltip;
