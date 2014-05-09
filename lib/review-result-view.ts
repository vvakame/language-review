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
		return this.div({class: "review-preview native-key-bindings", tabindex: -1});
	}

	reviewRunner:ReVIEWRunner;

	constructor(public editorView:V.IReVIEWedEditorView) {
		super();

		this.editorView.reviewResultView = this;
		this.editorView.overlayer.append(this.jq);

		this.reviewRunner = new ReVIEWRunner(this.editorView.getEditor());
		this.reviewRunner.startWatching();
	}

	get jq():JQuery {
		// dirty hack
		return <any>this;
	}

	beforeRemove() {
		console.log("debug ReVIEWResultView beforeRemove");
		this.reviewRunner.stopWatching();
	}

	refresh() {
		console.log("debug ReVIEWResultView refresh");
	}
}

export = ReVIEWResultView;
