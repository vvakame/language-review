/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />

/// <reference path="./typings/atom/atom.d.ts" />
/// <reference path="./typings/atom-package-dependencies/atom-package-dependencies.d.ts" />

/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

import url = require("url");
import _atom = require("atom");

import apd = require("atom-package-dependencies");

import V = require("./util/const");
import logger = require("./util/logger");
import ReVIEWPreviewView = require("./view/review-preview-view");
import ReVIEWOutlineView = require("./view/review-outline-view");
import ReVIEWSyntaxListView = require("./view/review-syntax-list-view");

class Controller {
	configDefaults = {
		grammars: [
			V.reviewScopeName
		],
		debug: false
	};

	editorViewSubscription:{ off():any; };
	outlineView:ReVIEWOutlineView;

	activate():void {
		let linter = apd.require("linter");
		if (!linter) {
			let notification = atom.notifications.addInfo("Re:VIEW: 足りない依存関係があるため、インストールを行っています。");
			apd.install(() => {
				atom.notifications.addSuccess("Re:VIEW: 準備ができました！");
				notification.dismiss();

				// Packages don't get loaded automatically as a result of an install
        if (!apd.require("linter")) {
					atom.packages.loadPackage("linter");
				}

				atom.packages.activatePackage("linter").then(() => this.readyToActivate());
			});
			return;
		}

		this.readyToActivate();
	}

	readyToActivate() {
		atom.workspaceView.command(V.protocol + "toggle-preview", ()=> {
			this.togglePreview();
		});
		atom.workspaceView.command(V.protocol + "toggle-outline", ()=> {
			this.toggleOutline();
		});
		atom.workspaceView.command(V.protocol + "toggle-syntax-list", ()=> {
			this.toggleSyntaxList();
		});

		atom.workspace.registerOpener((urlToOpen:string):_atom.View => {
			logger.log(urlToOpen);
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
	}

	deactivate() {
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
