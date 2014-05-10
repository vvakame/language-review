/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />
/// <reference path="../typings/pathwatcher/pathwatcher.d.ts" />

/// <reference path="../node_modules/review.js/dist/review.js.d.ts" />

import path = require("path");
import _atom = require("atom");

var $ = _atom.$;
var $$$ = _atom.$$$;

import pathwatcher = require("pathwatcher");
var File = pathwatcher.File;

import ReVIEW = require("review.js");

import V = require("./const");
import ReVIEWRunner = require("./review-runner");
import ViolationView = require("./violation-view");

class ReVIEWResultView extends _atom.View {

	static content():any {
		return this.div({class: "review-compile"});
	}

	reviewRunner:ReVIEWRunner;
	editor:AtomCore.IEditor;
	gutterView:AtomCore.IGutterView;
	editorDisplayUpdateSubscription:Emissary.ISubscription;
	pendingReports:ReVIEW.ProcessReport[];
	violationViews:ViolationView[] = [];

	constructor(public editorView:V.IReVIEWedEditorView) {
		super();

		this.editorView.reviewResultView = this;
		this.editorView.overlayer.append(this.jq);

		this.editor = this.editorView.getEditor();
		this.gutterView = this.editorView.gutter;

		this.reviewRunner = new ReVIEWRunner(this.editorView.getEditor());
		this.reviewRunner.on("activate", ()=> {
			console.log("ReVIEWResultView ReVIEWRunner activate");
			this.onCompileStarted();
		});
		this.reviewRunner.on("deactivate", ()=> {
			console.log("ReVIEWResultView ReVIEWRunner deactivate");
			this.onCompileSuspended();
		});
		this.reviewRunner.on("compile", reports=> {
			console.log("ReVIEWResultView ReVIEWRunner compile");
			this.onCompileResult(reports);
		});
		this.reviewRunner.startWatching();
	}

	get jq():JQuery {
		// dirty hack
		return <any>this;
	}

	beforeRemove() {
		console.log("debug ReVIEWResultView beforeRemove");
		this.reviewRunner.stopWatching();
		this.editorView.reviewResultView = null;
	}

	refresh() {
		console.log("debug ReVIEWResultView refresh");
	}

	onCompileStarted() {
		this.editorDisplayUpdateSubscription = this.subscribe(this.editorView, "editor:display-updated", ()=> {
			if (this.pendingReports) {
				// TODO
			}
			this.updateGutterMarkers();
		});
	}

	onCompileSuspended() {
		if (this.editorDisplayUpdateSubscription) {
			this.editorDisplayUpdateSubscription.off();
			this.editorDisplayUpdateSubscription = null;
		}
		this.removeViolationViews();
		this.updateGutterMarkers();
	}

	onCompileResult(reports:ReVIEW.ProcessReport[]) {
		this.removeViolationViews();

		if (this.editorView.active) {
			this.addViolationViews(reports);
		} else {
			this.pendingReports = reports;
		}

		this.updateGutterMarkers();
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

	updateGutterMarkers() {
		var gutterView:JQuery = <any>this.gutterView;
		if (!gutterView.isVisible()) {
			return;
		}

		this.gutterView.removeClassFromAllLines("review-error");

		if (this.violationViews.length === 0) {
			return;
		}
		this.violationViews.forEach(violationView => {
			var line = violationView.getCurrentBufferStartPosition().row;
			var klass = "review-error";
			this.gutterView.addClassToLine(line, klass);
		});
	}
}

export = ReVIEWResultView;
