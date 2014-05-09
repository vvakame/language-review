/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />

import url = require("url");
import _atom = require("atom");

import V = require("./const");
import ReVIEWPreviewView = require("./review-preview-view");
import ReVIEWResultView = require("./review-result-view");

class Controller {
	configDefaults = {
		grammars: [
			"source.review"
		]
	};

	resultViews:ReVIEWResultView[] = [];
	editorViewSubscription:{ off():any; };

	activate():void {
		atom.workspaceView.command(V.protocol + "toggle-preview", ()=> {
			this.togglePreview();
		});

		atom.workspace.registerOpener(urlToOpen => {
			console.log(urlToOpen);
			var tmpUrl = url.parse(urlToOpen);

			var pathName = tmpUrl.pathname;
			if (pathName) {
				pathName = decodeURI(pathName);
			}

			var protocol = tmpUrl.protocol;
			if (protocol !== V.protocol) {
				return;
			}
			var host = tmpUrl.host;
			if (host === V.previewHost) {
				return new ReVIEWPreviewView({editorId: pathName.substring(1)});
			} else {
				// TODO
				return new ReVIEWPreviewView({filePath: pathName});
			}
		});

		this.enableCompileResult();
	}

	enableCompileResult() {
		this.editorViewSubscription = atom.workspaceView.eachEditorView((editorView:_atom.EditorView)=> {
			this.injectLintViewIntoEditorView(editorView);
		});
	}

	disableCompileResult() {
		if (this.editorViewSubscription) {
			this.editorViewSubscription.off();
			this.editorViewSubscription = null;
		}
		this.resultViews.forEach(resultView => {
			resultView.jq.remove();
		});
		this.resultViews = [];
	}

	toggleCompileResult() {
	}

	togglePreview():void {
		var editor = atom.workspace.getActiveEditor();
		if (!editor) {
			return;
		}

		var grammars:string[] = atom.config.get("language-review.grammars") || [];
		if (!grammars.some(grammar => grammar === editor.getGrammar().scopeName)) {
			return;
		}

		var uri = V.protocol + "//" + V.previewHost + "/" + editor.id;

		var previewPane = atom.workspace.paneForUri(uri);

		if (previewPane) {
			previewPane.destroyItem(previewPane.itemForUri(uri));
			return;
		}

		var previousActivePane = atom.workspace.getActivePane();

		atom.workspace.open(uri, {
			split: "right",
			searchAllPanes: true
		}).done(previewView => {
			if (previewView instanceof ReVIEWPreviewView) {
				(<ReVIEWPreviewView>previewView).renderReVIEW();
				previousActivePane.activate();
			}
		});
	}

	injectLintViewIntoEditorView(editorView:_atom.EditorView) {
		if (!editorView.getPane()) {
			return;
		}
		if (!editorView.attached) {
			return;
		}
		var resultView = new ReVIEWResultView(<V.IReVIEWedEditorView>editorView);
		this.resultViews.push(resultView);
	}
}

var controller:any = new Controller();
export = controller;
