/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />
/// <reference path="../typings/text-buffer/text-buffer.d.ts" />

/// <reference path="../node_modules/review.js/dist/review.js.d.ts" />

import _atom = require("atom");
import _TextBuffer = require("text-buffer");

import ReVIEW = require("review.js");

import V = require("./const");
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

	constructor(public resultView:ReVIEWResultView, public report:ReVIEW.ProcessReport) {
		super();

		this.resultView.jq.add(this.jq);

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
	}

	initializeStates() {
		console.log(this.report);
		var node = this.report.nodes[0];
		var range = _TextBuffer.Range.fromObject({
			start: {
				row: node.line - 1,
				col: node.column
			},
			end: {
				row: node.line - 1,
				col: node.column + node.offset
			}
		});
		var screenRange = this.editor.screenRangeForBufferRange(range);
		this.screenStartPosition = screenRange.start;
		this.screenEndPosition = screenRange.end;

		this.isValid = true;
	}

	prepareTooltip() {
	}

	trackEdit() {
	}

	isVisibleMarkerChange() {
	}

	trackCursor() {
	}

	showHighlight() {
	}

	hideHighlight() {
	}

	updateHighlight() {
	}

	toggleTooltipWithCursorPosition() {
	}

	getCurrentBufferStartPosition() {
		return this.editor.bufferPositionForScreenPosition(this.screenStartPosition);
	}

	getCurrentScreenRange() {
	}

	tooltip() {
	}

	beforeRemove() {
	}
}

export = ViolationView;
