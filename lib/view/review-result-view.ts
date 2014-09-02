/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/pathwatcher/pathwatcher.d.ts" />

/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />

// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-view.coffee

import _atom = require("atom");

import ReVIEW = require("review.js");

import V = require("../util/const");
import logger = require("../util/logger");
import ReVIEWRunner = require("../util/review-runner");
import ViolationView = require("./violation-view");

class ReVIEWResultView extends _atom.View {

	static content():any {
		return this.div({class: "review-compile"});
	}

	reviewRunner:ReVIEWRunner;
	editor:AtomCore.IEditor;
	editorDisplayUpdateSubscription:Emissary.ISubscription;
	pendingReports:ReVIEW.ProcessReport[];
	violationViews:ViolationView[] = [];

	constructor(public editorView:V.IReVIEWedEditorView) {
		super();

		this.editorView.reviewResultView = this;
		this.editorView.overlayer.append(this.jq);

		this.editor = this.editorView.getEditor();

		this.reviewRunner = new ReVIEWRunner({editor: this.editorView.getEditor()});
		this.reviewRunner.on("activate", ()=> {
			logger.log("ReVIEWResultView ReVIEWRunner activate");
			this.onCompileStarted();
		});
		this.reviewRunner.on("deactivate", ()=> {
			logger.log("ReVIEWResultView ReVIEWRunner deactivate");
			this.onCompileSuspended();
		});
		this.reviewRunner.on("report", reports=> {
			logger.log("ReVIEWResultView ReVIEWRunner compile");
			this.onCompileResult(reports);
		});
		this.reviewRunner.startWatching();

		this.editorView.command(V.protocol + "move-to-next-violation", ()=> this.moveToNextViolation());
		this.editorView.command(V.protocol + "move-to-previous-violation", ()=> this.moveToPreviousViolation());
	}

	get jq():JQuery {
		// dirty hack
		return <any>this;
	}

	beforeRemove() {
		logger.log();
		this.removeViolationViews();
		this.reviewRunner.stopWatching();
	}

	refresh() {
		logger.log();
	}

	onCompileStarted() {
		this.editorDisplayUpdateSubscription = this.subscribe(this.editorView, "editor:display-updated", ()=> {
			if (this.pendingReports) {
				this.addViolationViews(this.pendingReports);
				this.pendingReports = null;
			}
		});
	}

	onCompileSuspended() {
		if (this.editorDisplayUpdateSubscription) {
			this.editorDisplayUpdateSubscription.off();
			this.editorDisplayUpdateSubscription = null;
		}
		this.removeViolationViews();
	}

	onCompileResult(reports:ReVIEW.ProcessReport[]) {
		this.removeViolationViews();

		if (this.editorView.active) {
			this.addViolationViews(reports);
		} else {
			this.pendingReports = reports;
		}
	}

	addViolationViews(reports:ReVIEW.ProcessReport[]) {
		reports.forEach(report => {
			var violationView = new ViolationView(this, report);
			this.violationViews.push(violationView);
		});
	}

	removeViolationViews() {
		this.violationViews.forEach(violationView=> {
			violationView.jq.remove();
		});
		this.violationViews = [];
	}

	moveToNextViolation() {
		this.moveToOtherViolation((a, b)=> a.isGreaterThan(b), (values)=>values.shift());
	}

	moveToPreviousViolation() {
		this.moveToOtherViolation((a, b)=> a.isLessThan(b), (values)=>values.pop());
	}

	moveToOtherViolation(comparator:(a:TextBuffer.IPoint, b:TextBuffer.IPoint)=>boolean, getOne:(value:ViolationView[])=>ViolationView) {
		if (this.violationViews.length === 0) {
			atom.beep();
			return;
		}

		var currentCursorPosition = this.editor.getCursor().getScreenPosition();
		var neighborViolationViews = this.violationViews.filter(violationView=> {
			var violationPosition = violationView.screenStartPosition;
			return comparator(violationPosition, currentCursorPosition);
		});
		var neighborViolationView = getOne(neighborViolationViews);
		if (neighborViolationView) {
			this.editor.setCursorScreenPosition(neighborViolationView.screenStartPosition);
		} else {
			atom.beep();
		}
	}
}

export = ReVIEWResultView;
