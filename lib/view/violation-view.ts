/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/text-buffer/text-buffer.d.ts" />

/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />

// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/violation-view.coffee

import _atom = require("atom");
var $ = _atom.$;
import _TextBuffer = require("text-buffer");

import ReVIEW = require("review.js");

import V = require("../util/const");
import ViolationTooltip = require("../tooltip/validation-tooltip");
import tooltip = require("../tooltip/tooltip");
import ReVIEWResultView = require("./review-result-view");

class ViolationView extends _atom.View {

	static content():any {
		return this.div({class: "violation"}, ()=> {
			this.div({class: "violation-arrow"});
			this.div({class: "violation-area"});
		});
	}

	editorView:V.IReVIEWedEditorView;
	editor:AtomCore.IEditor;

	screenStartPosition:TextBuffer.IPoint;
	screenEndPosition:TextBuffer.IPoint;
	isValid:boolean;

	marker:AtomCore.IDisplayBufferMarker;

	$arrow:JQuery;
	$area:JQuery;

	constructor(public resultView:ReVIEWResultView, public report:ReVIEW.ProcessReport) {
		super();

		this.resultView.jq.append(this.jq);

		this.editorView = resultView.editorView;
		this.editor = resultView.editor;

		this.initializeSubviews();
		this.initializeStates();

		this.prepareTooltip();
		this.trackEdit();
		this.trackCursor();
		this.showHighlight();
		this.toggleTooltipWithCursorPosition();
	}

	get jq():JQuery {
		// dirty hack
		return <any>this;
	}

	initializeSubviews() {
		this.$arrow = this.jq.find(".violation-arrow");
		this.$arrow.addClass("violation-" + ReVIEW.ReportLevel[this.report.level].toLowerCase());

		this.$area = this.jq.find(".violation-area");
		this.$area.addClass("violation-" + ReVIEW.ReportLevel[this.report.level].toLowerCase());
	}

	initializeStates() {
		var node = this.report.nodes[0];
		var screenRange = this.editor.screenRangeForBufferRange(this.syntaxTreeToRange(node));
		this.screenStartPosition = screenRange.start;
		this.screenEndPosition = screenRange.end;

		this.isValid = true;
	}

	syntaxTreeToRange(node:ReVIEW.Parse.SyntaxTree):TextBuffer.IRange {
		// TODO endの実装が間違ってる気がする…
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
		console.log("syntaxTreeToRange", range);
		return range;
	}

	prepareTooltip() {
		this.tooltip({
			title: this.report.message,
			html: false,
			container: this.resultView,
			selector: this.jq.find(".violation-area")
		});
	}

	trackEdit() {
		var options = { invalidation: "inside", persistent: false };
		this.marker = this.editor.markScreenRange(this.getCurrentScreenRange(), options);
		this.marker.on("changed", (event:any)=> {
			this.screenStartPosition = event.newTailScreenPosition;
			this.screenEndPosition = event.newHeadScreenPosition;
			this.isValid = event.isValid;

			if (this.isValid) {
				if (this.isVisibleMarkerChange(event)) {
					setImmediate(()=> {
						this.showHighlight();
						this.toggleTooltipWithCursorPosition();
					});
				} else {
					this.jq.hide();
					// TODO 500㍉秒毎になんかするっぽい
				}
			} else {
				this.hideHighlight();
				this.tooltip("hide");
			}
		});
	}

	isVisibleMarkerChange(event:any) {
		var editorFirstVisibleRow = this.editorView.getFirstVisibleScreenRow();
		var editorLastVisibleRow = this.editorView.getLastVisibleScreenRow();
		return [event.oldTailScreenPosition, event.newTailScreenPosition].some(position => {
			return editorFirstVisibleRow <= position.row && position.row <= editorLastVisibleRow;
		});
	}

	trackCursor() {
		this.subscribe(this.editor.getCursor(), "moved", ()=> {
			if (this.isValid) {
				this.toggleTooltipWithCursorPosition();
			} else {
				this.tooltip("hide");
			}
		});
	}

	showHighlight() {
		this.updateHighlight();
		this.jq.show();
	}

	hideHighlight() {
		this.jq.hide();
	}

	updateHighlight() {
		var startPixelPosition = this.editorView.pixelPositionForScreenPosition(this.screenStartPosition);
		var endPixelPosition = this.editorView.pixelPositionForScreenPosition(this.screenEndPosition);
		var arrowSize = this.editorView.charWidth / 2;
		var verticalOffset = this.editorView.lineHeight + Math.floor(arrowSize / 4);

		this.jq.css({
			top: startPixelPosition.top,
			left: startPixelPosition.left,
			width: this.editorView.charWidth - (this.editorView.charWidth % 2), // Adjust toolbar tip center
			height: verticalOffset
		});

		this.$arrow.css({
			"border-right-width": arrowSize,
			"border-bottom-width": arrowSize,
			"border-left-width": arrowSize
		});

		var borderOffset = arrowSize / 2;
		this.$area.css({
			left: borderOffset, // Avoid protruding left edge of the border from the arrow
			width: endPixelPosition.left - startPixelPosition.left - borderOffset,
			height: verticalOffset
		});
		if (this.screenEndPosition.column - this.screenStartPosition.column > 1) {
			this.$area.addClass("violation-border");
		} else {
			this.$area.removeClass("violation-border");
		}
	}

	toggleTooltipWithCursorPosition() {
		var cursorPosition = this.editor.getCursor().getScreenPosition();

		if (cursorPosition.row === this.screenStartPosition.row && cursorPosition.column === this.screenStartPosition.column) {
			this.tooltip("show");
		} else {
			this.tooltip("hide");
		}
	}

	getCurrentBufferStartPosition() {
		return this.editor.bufferPositionForScreenPosition(this.screenStartPosition);
	}

	getCurrentScreenRange() {
		return new _TextBuffer.Range(this.screenStartPosition, this.screenEndPosition);
	}

	tooltip(message:string):void;

	tooltip(option:tooltip.IViolationTooltipOptions):void;

	tooltip(option:any):void {
		var violationView = this;
		this.jq.each(function () {
			console.log("ViolationView tooltip option=" + option);
			var $this = $(this);
			var data:ViolationTooltip = $this.data("bs.tooltip");

			if (!data) {
				data = new ViolationTooltip(violationView.editorView, this, option);
				$this.data("bs.tooltip", data);
			}
			if (typeof option === "string") {
				(<any>data)[option]();
			}
		});
	}

	beforeRemove() {
		if (this.marker) {
			this.marker.destroy();
		}
		this.tooltip("destroy");
	}
}

export = ViolationView;
