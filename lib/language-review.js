/// <reference path="../node_modules/typescript/bin/lib.es6.d.ts" />
/// <reference path="../node_modules/review.js/dist/review.js.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />
/// <reference path="./typings/atom/atom.d.ts" />
/// <reference path="./typings/atom-space-pen-views/atom-space-pen-views.d.ts" />
/// <reference path="./typings/atom-package-dependencies/atom-package-dependencies.d.ts" />
var url = require("url");
var apd = require("atom-package-dependencies");
var V = require("./util/const");
var logger = require("./util/logger");
var linter = require("./linter");
var ReVIEWPreviewView = require("./view/review-preview-view");
var ReVIEWOutlineView = require("./view/review-outline-view");
var ReVIEWSyntaxListView = require("./view/review-syntax-list-view");
var Controller = (function () {
    function Controller() {
        this.config = {
            debugLanguageReVIEW: {
                title: "Debug: language-review. please do not use this option.",
                type: "boolean",
                default: false
            },
            grammar: {
                title: "grammer scope. please do not change this option.",
                type: "string",
                default: V.reviewScopeName
            }
        };
    }
    Controller.prototype.provideLinter = function () {
        return {
            grammarScopes: [V.reviewScopeName],
            scope: "file",
            lintOnFly: false,
            lint: linter
        };
    };
    Controller.prototype.activate = function () {
        var _this = this;
        var linter = apd.require("linter");
        if (!linter) {
            var notification = atom.notifications.addInfo("Re:VIEW: 足りない依存関係があるため、インストールを行っています。");
            apd.install(function () {
                atom.notifications.addSuccess("Re:VIEW: 準備ができました！");
                notification.dismiss();
                // Packages don't get loaded automatically as a result of an install
                if (!apd.require("linter")) {
                    atom.packages.loadPackage("linter");
                }
                atom.packages.activatePackage("linter").then(function () { return _this.readyToActivate(); });
            });
            return;
        }
        this.readyToActivate();
    };
    Controller.prototype.readyToActivate = function () {
        var _this = this;
        atom.commands.add("atom-workspace", V.protocol + "toggle-preview", function () {
            _this.togglePreview();
        });
        atom.commands.add("atom-workspace", V.protocol + "toggle-outline", function () {
            _this.toggleOutline();
        });
        atom.commands.add("atom-workspace", V.protocol + "toggle-syntax-list", function () {
            _this.toggleSyntaxList();
        });
        atom.workspace.addOpener(function (urlToOpen) {
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
    };
    Controller.prototype.deactivate = function () {
    };
    Controller.prototype.togglePreview = function () {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
            return;
        }
        if (atom.config.get("language-review.grammar") !== editor.getGrammar().scopeName) {
            return;
        }
        var uri = V.protocol + "//" + V.previewHost + "/" + editor.id;
        var previewPane = atom.workspace.paneForURI(uri);
        if (previewPane) {
            previewPane.destroyItem(previewPane.itemForURI(uri));
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
    Controller.prototype.toggleSyntaxList = function () {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
            return;
        }
        if (atom.config.get("language-review.grammar") !== editor.getGrammar().scopeName) {
            return;
        }
        var uri = V.protocol + "//" + V.syntaxListHost + "/" + editor.id;
        var previewPane = atom.workspace.paneForURI(uri);
        if (previewPane) {
            previewPane.destroyItem(previewPane.itemForURI(uri));
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