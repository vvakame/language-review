// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-view.coffee
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var atom_space_pen_views_1 = require("atom-space-pen-views");
var ReVIEW = require("review.js");
var V = require("../util/const");
var logger = require("../util/logger");
var review_runner_1 = require("../util/review-runner");
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
                _this.runner = new review_runner_1.default({ editor: editor });
                _this.handleEvents();
            }).catch(function (_reason) {
                // The editor this preview was created for has been closed so close
                // this preview since a preview cannot be rendered without an editor
                var view = _this.jq.parents(".pane").view();
                if (view) {
                    view.destroyItem(_this);
                }
            });
        }
        else {
            throw new Error("editorId is required");
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
            filePath: null,
            editorId: this.editorId,
        };
    };
    ReVIEWSyntaxListView.prototype.destroy = function () {
        if (this.runner) {
            // https://github.com/vvakame/language-review/issues/54#issuecomment-210971891
            this.runner.deactivate();
        }
    };
    ReVIEWSyntaxListView.prototype.resolveEditor = function (editorId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var func = function () {
                var editor = _this.editorForId(editorId);
                _this.editor = editor;
                if (editor) {
                    _this.jq.trigger("title-changed");
                    resolve(editor);
                }
                else {
                    reject();
                }
            };
            if (atom.workspace) {
                func();
            }
            else {
                atom.packages.onDidActivateInitialPackages(function () {
                    func();
                });
            }
        });
    };
    ReVIEWSyntaxListView.prototype.editorForId = function (editorId) {
        var foundEditors = atom.workspace.getTextEditors().filter(function (editor) {
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
        atom.commands.add(this, "core:move-up", function () { return _this.jq.scrollUp(); });
        atom.commands.add(this, "core:move-down", function () { return _this.jq.scrollDown(); });
        atom.commands.add("atom-workspace", "language-review:zoom-in", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel + 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:zoom-out", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel - 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:reset-zoom", function () {
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
        var $div = atom_space_pen_views_1.$("<div>");
        atom_space_pen_views_1.$("<h1>").text("Re:VIEW記法の説明").appendTo($div);
        /* tslint:disable:variable-name */
        var SyntaxType = ReVIEW.SyntaxType;
        /* tslint:enable:variable-name */
        this.acceptableSyntaxes.acceptableSyntaxes.forEach(function (syntax) {
            var $syntax = atom_space_pen_views_1.$("<div>");
            switch (syntax.type) {
                case SyntaxType.Other:
                    switch (syntax.symbolName) {
                        case "headline":
                            atom_space_pen_views_1.$("<span>").text("={???} タイトル").appendTo($syntax);
                            break;
                        case "ulist":
                            atom_space_pen_views_1.$("<span>").text(" * 文字列").appendTo($syntax);
                            break;
                        case "olist":
                            atom_space_pen_views_1.$("<span>").text(" 1. 文字列").appendTo($syntax);
                            break;
                        case "dlist":
                            atom_space_pen_views_1.$("<span>").text(" : 定義 説明").appendTo($syntax);
                            break;
                        default:
                            logger.warn("test", syntax);
                            break;
                    }
                    break;
                case SyntaxType.Inline:
                    atom_space_pen_views_1.$("<span>").text("@<" + syntax.symbolName + ">{}").appendTo($syntax);
                    break;
                case SyntaxType.Block:
                    syntax.argsLength.forEach(function (len) {
                        var text = "//" + syntax.symbolName;
                        for (var i = 0; i < len; i++) {
                            text += "[???]";
                        }
                        atom_space_pen_views_1.$("<div>").text(text).appendTo($syntax);
                    });
                    break;
                default:
            }
            var $description = atom_space_pen_views_1.$("<pre>").text(syntax.description);
            $description.appendTo($syntax);
            $syntax.append("<hr>");
            $syntax.appendTo($div);
            $syntax.data("syntax", syntax);
        });
        this.jq.empty();
        this.jq.append($div);
    };
    ReVIEWSyntaxListView.prototype.getTitle = function () {
        if (this.editor) {
            return this.editor.getTitle() + " Syntax List";
        }
        else {
            return "Re:VIEW Syntax List";
        }
    };
    ReVIEWSyntaxListView.prototype.getURI = function () {
        return "language-review://" + V.syntaxListHost + "/" + this.editorId;
    };
    ReVIEWSyntaxListView.prototype.getPath = function () {
        if (this.editor) {
            return this.editor.getPath();
        }
        return null;
    };
    return ReVIEWSyntaxListView;
}(atom_space_pen_views_1.ScrollView));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReVIEWSyntaxListView;
atom.deserializers.add(ReVIEWSyntaxListView);
//# sourceMappingURL=review-syntax-list-view.js.map