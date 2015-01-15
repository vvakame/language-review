/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/pathwatcher/pathwatcher.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />
// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-view.coffee
var path = require("path");
var _atom = require("atom");
var $ = _atom.$;
var pathwatcher = require("pathwatcher");
var File = pathwatcher.File;
var Q = require("q");
var ReVIEW = require("review.js");
var V = require("../util/const");
var logger = require("../util/logger");
var ReVIEWRunner = require("../util/review-runner");
var ReVIEWSyntaxListView = (function (_super) {
    __extends(ReVIEWSyntaxListView, _super);
    function ReVIEWSyntaxListView(params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        _super.call(this);
        this.editorId = params.editorId;
        if (this.editorId) {
            var promise = this.resolveEditor(this.editorId);
            promise.then(function (editor) {
                _this.runner = new ReVIEWRunner({ editor: editor }, { highFrequency: true });
                _this.handleEvents();
            }).catch(function (reason) {
                // The editor this preview was created for has been closed so close
                // this preview since a preview cannot be rendered without an editor
                var view = _this.jq.parents(".pane").view();
                if (view) {
                    view.destroyItem(_this);
                }
            });
        }
        else if (params.filePath) {
            this.file = new File(params.filePath);
            this.runner = new ReVIEWRunner({ file: this.file });
            this.handleEvents();
        }
        else {
            throw new Error("editorId or filePath are required");
        }
    }
    ReVIEWSyntaxListView.deserialize = function (state) {
        return new ReVIEWSyntaxListView(state);
    };
    ReVIEWSyntaxListView.content = function () {
        return this.div({ class: "review-syntax-list native-key-bindings", tabindex: -1 });
    };
    Object.defineProperty(ReVIEWSyntaxListView.prototype, "jq", {
        get: function () {
            // dirty hack
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ReVIEWSyntaxListView.prototype.serialize = function () {
        return {
            deserializer: "ReVIEWSyntaxListView",
            filePath: this.file ? this.getPath() : null,
            editorId: this.editorId
        };
    };
    ReVIEWSyntaxListView.prototype.destroy = function () {
        this.runner.deactivate();
        this.unsubscribe();
    };
    ReVIEWSyntaxListView.prototype.resolveEditor = function (editorId) {
        var _this = this;
        var deferred = Q.defer();
        var resolve = function () {
            var editor = _this.editorForId(editorId);
            _this.editor = editor;
            if (editor) {
                _this.jq.trigger("title-changed");
                deferred.resolve(editor);
            }
            else {
                deferred.reject(null);
            }
        };
        if (atom.workspace) {
            resolve();
        }
        else {
            atom.packages.once("activated", function () {
                resolve();
            });
        }
        return deferred.promise;
    };
    ReVIEWSyntaxListView.prototype.editorForId = function (editorId) {
        var foundEditors = atom.workspace.getEditors().filter(function (editor) {
            var id = editor.id;
            if (!id) {
                return false;
            }
            return id.toString() === editorId.toString();
        });
        return foundEditors[0];
    };
    ReVIEWSyntaxListView.prototype.handleEvents = function () {
        var _this = this;
        this.subscribe(atom.syntax, "grammar-added grammar-updated", function () {
            setTimeout(function () { return _this.renderSyntaxList(); }, 250);
        });
        this.subscribe(this, "core:move-up", function () { return _this.jq.scrollUp(); });
        this.subscribe(this, "core:move-down", function () { return _this.jq.scrollDown(); });
        this.subscribeToCommand(atom.workspaceView, "language-review:zoom-in", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel + 0.1);
        });
        this.subscribeToCommand(atom.workspaceView, "language-review:zoom-out", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel - 0.1);
        });
        this.subscribeToCommand(atom.workspaceView, "language-review:reset-zoom", function () {
            _this.jq.css("zoom", 1);
        });
        this.runner.on("syntax", function (acceptableSyntaxes) {
            _this.acceptableSyntaxes = acceptableSyntaxes;
            _this.renderSyntaxList();
        });
        this.runner.activate();
    };
    ReVIEWSyntaxListView.prototype.renderSyntaxList = function () {
        if (!this.acceptableSyntaxes) {
            return;
        }
        var $div = $("<div>");
        $("<h1>").text("Re:VIEW記法の説明").appendTo($div);
        var SyntaxType = ReVIEW.Build.SyntaxType;
        this.acceptableSyntaxes.acceptableSyntaxes.forEach(function (syntax) {
            var $syntax = $("<div>");
            switch (syntax.type) {
                case 2 /* Other */:
                    switch (syntax.symbolName) {
                        case "headline":
                            $("<span>").text("={???} タイトル").appendTo($syntax);
                            break;
                        case "ulist":
                            $("<span>").text(" * 文字列").appendTo($syntax);
                            break;
                        case "olist":
                            $("<span>").text(" 1. 文字列").appendTo($syntax);
                            break;
                        case "dlist":
                            $("<span>").text(" : 定義 説明").appendTo($syntax);
                            break;
                        default:
                            logger.warn("test", syntax);
                            break;
                    }
                    break;
                case 1 /* Inline */:
                    $("<span>").text("@<" + syntax.symbolName + ">{}").appendTo($syntax);
                    break;
                case 0 /* Block */:
                    syntax.argsLength.forEach(function (len) {
                        var text = "//" + syntax.symbolName;
                        for (var i = 0; i < len; i++) {
                            text += "[???]";
                        }
                        $("<div>").text(text).appendTo($syntax);
                    });
                    break;
            }
            var $description = $("<pre>").text(syntax.description);
            $description.appendTo($syntax);
            $syntax.append("<hr>");
            $syntax.appendTo($div);
            $syntax.data("syntax", syntax);
        });
        this.jq.empty();
        this.jq.append($div);
    };
    ReVIEWSyntaxListView.prototype.getTitle = function () {
        if (this.file) {
            return path.basename(this.getPath()) + " Syntax List";
        }
        else if (this.editor) {
            return this.editor.getTitle() + " Syntax List";
        }
        else {
            return "Re:VIEW Syntax List";
        }
    };
    ReVIEWSyntaxListView.prototype.getUri = function () {
        if (this.file) {
            return "language-review://" + this.getPath();
        }
        else {
            return "language-review://" + V.syntaxListHost + "/" + this.editorId;
        }
    };
    ReVIEWSyntaxListView.prototype.getPath = function () {
        if (this.file) {
            return this.file.getPath();
        }
        else if (this.editor) {
            return this.editor.getPath();
        }
        return null;
    };
    return ReVIEWSyntaxListView;
})(_atom.ScrollView);
atom.deserializers.add(ReVIEWSyntaxListView);
module.exports = ReVIEWSyntaxListView;
//# sourceMappingURL=review-syntax-list-view.js.map