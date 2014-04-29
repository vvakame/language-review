/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />

import url = require("url");

import ReVIEWPreviewView = require("./review-preview-view");

var obj = {
	configDefaults: {
		grammars: [
			"source.review"
		]
	},
	activate: ()=> {
		atom.workspaceView.command("review-preview:toggle", ()=> {
			obj.toggle();
		});

		atom.workspace.registerOpener(urlToOpen => {
			console.log(urlToOpen);
			var tmpUrl = url.parse(urlToOpen);

			var pathName = tmpUrl.pathname;
			if (pathName) {
				pathName = decodeURI(pathName);
			}

			var protocol = tmpUrl.protocol;
			if (protocol !== "review-preview:") {
				return;
			}
			var host = tmpUrl.host;
			if (host === "editor") {
				return new ReVIEWPreviewView({editorId: pathName.substring(1)});
			} else {
				return new ReVIEWPreviewView({filePath: pathName});
			}
		});
	},
	toggle: ()=> {
		console.log("toggle!");
		var editor = atom.workspace.getActiveEditor();
		if (!editor) {
			return;
		}

		var grammars:string[] = atom.config.get("language-review.grammars") || [];
		console.log(editor.getGrammar().scopeName);
		console.log(grammars);
		if (!grammars.some(grammar => grammar === editor.getGrammar().scopeName)) {
			return;
		}

		var uri = "review-preview://editor/" + editor.id;

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
};

export = obj;
