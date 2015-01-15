/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
var url = require("url");
var V = require("./util/const");
var logger = require("./util/logger");
var ReVIEWPreviewView = require("./view/review-preview-view");
var ReVIEWResultView = require("./view/review-result-view");
var ReVIEWStatusView = require("./view/review-status-view");
var ReVIEWOutlineView = require("./view/review-outline-view");
var ReVIEWSyntaxListView = require("./view/review-syntax-list-view");
var Controller = (function () {
    function Controller() {
        this.configDefaults = {
            grammars: [
                "source.review"
            ],
            debug: false
        };
        this.resultViews = [];
    }
    Controller.prototype.activate = function () {
        var _this = this;
        atom.workspaceView.command(V.protocol + "toggle-preview", function () {
            _this.togglePreview();
        });
        atom.workspaceView.command(V.protocol + "toggle-compile", function () {
            _this.toggleCompileResult();
        });
        atom.workspaceView.command(V.protocol + "toggle-outline", function () {
            _this.toggleOutline();
        });
        atom.workspaceView.command(V.protocol + "toggle-syntax-list", function () {
            _this.toggleSyntaxList();
        });
        atom.workspace.registerOpener(function (urlToOpen) {
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
                return new ReVIEWPreviewView({ editorId: pathName.substring(1) });
            }
            else if (host === V.syntaxListHost) {
                return new ReVIEWSyntaxListView({ editorId: pathName.substring(1) });
            }
            else {
                // TODO
                return new ReVIEWPreviewView({ filePath: pathName });
            }
        });
        this.enableCompileResult();
    };
    Controller.prototype.deactivate = function () {
        this.disableCompileResult();
    };
    Controller.prototype.enableCompileResult = function () {
        var _this = this;
        this.editorViewSubscription = atom.workspaceView.eachEditorView(function (editorView) {
            _this.injectResultViewIntoEditorView(editorView);
        });
        this.injectStatusViewIntoStatusBar();
        atom.packages.once("activated", function () {
            _this.injectStatusViewIntoStatusBar();
        });
    };
    Controller.prototype.disableCompileResult = function () {
        if (this.reviewStatusView) {
            this.reviewStatusView.jq.remove();
            this.reviewStatusView = null;
        }
        if (this.editorViewSubscription) {
            this.editorViewSubscription.off();
            this.editorViewSubscription = null;
        }
        this.resultViews.forEach(function (resultView) {
            resultView.jq.remove();
        });
        this.resultViews = [];
    };
    Controller.prototype.toggleCompileResult = function () {
        if (this.editorViewSubscription) {
            this.disableCompileResult();
        }
        else {
            this.enableCompileResult();
        }
    };
    Controller.prototype.togglePreview = function () {
        var editor = atom.workspace.getActiveEditor();
        if (!editor) {
            return;
        }
        var grammars = atom.config.get("language-review.grammars") || [];
        if (!grammars.some(function (grammar) { return grammar === editor.getGrammar().scopeName; })) {
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
        }).done(function (view) {
            if (view instanceof ReVIEWPreviewView) {
                view.renderReVIEW();
                previousActivePane.activate();
            }
        });
    };
    Controller.prototype.toggleOutline = function () {
        if (!this.outlineView) {
            this.outlineView = new ReVIEWOutlineView();
        }
        this.outlineView.toggle();
    };
    Controller.prototype.injectResultViewIntoEditorView = function (editorView) {
        if (!editorView.getPane()) {
            return;
        }
        if (!editorView.attached) {
            return;
        }
        var resultView = new ReVIEWResultView(editorView);
        this.resultViews.push(resultView);
    };
    Controller.prototype.injectStatusViewIntoStatusBar = function () {
        if (this.reviewStatusView) {
            return;
        }
        var statusBar = atom.workspaceView.statusBar;
        if (!statusBar) {
            return;
        }
        this.reviewStatusView = new ReVIEWStatusView(statusBar);
        statusBar.prependRight(this.reviewStatusView);
    };
    Controller.prototype.toggleSyntaxList = function () {
        var editor = atom.workspace.getActiveEditor();
        if (!editor) {
            return;
        }
        var grammars = atom.config.get("language-review.grammars") || [];
        if (!grammars.some(function (grammar) { return grammar === editor.getGrammar().scopeName; })) {
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
        }).done(function (view) {
            if (view instanceof ReVIEWSyntaxListView) {
                view.renderSyntaxList();
                previousActivePane.activate();
            }
        });
    };
    return Controller;
})();
var controller = new Controller();
module.exports = controller;
//# sourceMappingURL=language-review.js.map