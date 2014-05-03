/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />

import url = require("url");

import V = require("./const");
import ReVIEWPreviewView = require("./review-preview-view");

class Controller {
	configDefaults = {
		grammars: [
			"source.review"
		]
	};

	activate():void {
		atom.workspaceView.command(V.protocol + "toggle-preview", ()=> {
			this.toggle();
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
	}

	toggle():void {
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
}

var controller:any = new Controller();
export = controller;
