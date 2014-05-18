/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />

import url = require("url");
import _atom = require("atom");

import V = require("./util/const");
import ReVIEWPreviewView = require("./view/review-preview-view");
import ReVIEWResultView = require("./view/review-result-view");
import ReVIEWStatusView = require("./view/review-status-view");
import ReVIEWOutlineView = require("./view/review-outline-view");
import ReVIEWSyntaxListView = require("./view/review-syntax-list-view");

class Controller {
	configDefaults = {
		grammars: [
			"source.review"
		]
	};

	reviewStatusView:ReVIEWStatusView;
	resultViews:ReVIEWResultView[] = [];
	editorViewSubscription:{ off():any; };
	outlineView:ReVIEWOutlineView;

	activate():void {
		atom.workspaceView.command(V.protocol + "toggle-preview", ()=> {
			this.togglePreview();
		});
		atom.workspaceView.command(V.protocol + "toggle-compile", ()=> {
			this.toggleCompileResult();
		});
		atom.workspaceView.command(V.protocol + "toggle-outline", ()=> {
			this.toggleOutline();
		});
		atom.workspaceView.command(V.protocol + "toggle-syntax-list", ()=> {
			this.toggleSyntaxList();
		});

		atom.workspace.registerOpener((urlToOpen:string):_atom.View => {
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
			} else if (host === V.syntaxListHost) {
				return new ReVIEWSyntaxListView({editorId: pathName.substring(1)});
			} else {
				// TODO
				return new ReVIEWPreviewView({filePath: pathName});
			}
		});

		this.enableCompileResult();
	}

	deactivate() {
		this.disableCompileResult();
	}

	enableCompileResult() {
		this.editorViewSubscription = atom.workspaceView.eachEditorView((editorView:_atom.EditorView)=> {
			this.injectResultViewIntoEditorView(editorView);
		});

		this.injectStatusViewIntoStatusBar();
		atom.packages.once("activated", ()=> {
			this.injectStatusViewIntoStatusBar();
		});
	}

	disableCompileResult() {
		if (this.reviewStatusView) {
			this.reviewStatusView.jq.remove();
			this.reviewStatusView = null;
		}
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
		if (this.editorViewSubscription) {
			this.disableCompileResult();
		} else {
			this.enableCompileResult();
		}
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
		}).done(view => {
			if (view instanceof ReVIEWPreviewView) {
				(<ReVIEWPreviewView>view).renderReVIEW();
				previousActivePane.activate();
			}
		});
	}

	toggleOutline() {
		if (!this.outlineView) {
			this.outlineView = new ReVIEWOutlineView();
		}
		this.outlineView.toggle();
	}

	injectResultViewIntoEditorView(editorView:_atom.EditorView) {
		if (!editorView.getPane()) {
			return;
		}
		if (!editorView.attached) {
			return;
		}
		var resultView = new ReVIEWResultView(<V.IReVIEWedEditorView>editorView);
		this.resultViews.push(resultView);
	}

	injectStatusViewIntoStatusBar() {
		if (this.reviewStatusView) {
			return;
		}
		var statusBar = atom.workspaceView.statusBar;
		if (!statusBar) {
			return;
		}
		this.reviewStatusView = new ReVIEWStatusView(statusBar);
		statusBar.prependRight(this.reviewStatusView);
	}

	toggleSyntaxList() {
		var editor = atom.workspace.getActiveEditor();
		if (!editor) {
			return;
		}

		var grammars:string[] = atom.config.get("language-review.grammars") || [];
		if (!grammars.some(grammar => grammar === editor.getGrammar().scopeName)) {
			return;
		}

		var uri = V.protocol + "//" + V.syntaxListHost + "/" + editor.id;

		var previewPane = atom.workspace.paneForUri(uri);

		if (previewPane) {
			previewPane.destroyItem(previewPane.itemForUri(uri));
			return;
		}

		var previousActivePane = atom.workspace.getActivePane();

		atom.workspace.open(uri, {
			split: "right",
			searchAllPanes: true
		}).done(view => {
			if (view instanceof ReVIEWSyntaxListView) {
				(<ReVIEWSyntaxListView>view).renderSyntaxList();
				previousActivePane.activate();
			}
		});
	}
}

var controller:any = new Controller();
export = controller;
