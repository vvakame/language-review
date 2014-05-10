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

class ReVIEWResultView extends _atom.View {

	static content():any {
		return this.div({class: "review-compile"});
	}

	reviewRunner:ReVIEWRunner;
	editor:AtomCore.IEditor;
	gutterView:AtomCore.IGutterView;
	editorDisplayUpdateSubscription:Emissary.ISubscription;
	pendingViolations:any[];

	constructor(public editorView:V.IReVIEWedEditorView) {
		super();

		this.editorView.reviewResultView = this;
		this.editorView.overlayer.append(this.jq);

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
		this.reviewRunner.on("compile", (error:any, violations:any)=> {
			console.log("ReVIEWResultView ReVIEWRunner compile");
			this.onCompileResult(error, violations);
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
			if (this.pendingViolations) {
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

	onCompileResult(error:any, violations:any) {
		this.removeViolationViews();

		if (error) {
			console.log(error);
		} else if (this.editorView.active) {
			this.addViolationViews(violations);
		} else {
			this.pendingViolations = violations;
		}

		this.updateGutterMarkers();
	}

	addViolationViews(violations:any) {

	}

	removeViolationViews() {

	}

	getValidViolationViews() {

	}

	updateGutterMarkers() {

	}
}

export = ReVIEWResultView;
