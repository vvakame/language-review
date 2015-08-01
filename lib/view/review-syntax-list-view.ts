/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/pathwatcher/pathwatcher.d.ts" />

/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />

// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-view.coffee

import path = require("path");

import {$, ScrollView} from "atom-space-pen-views";

import pathwatcher = require("pathwatcher");
var File = pathwatcher.File;

import Q = require("q");

import ReVIEW = require("review.js");

import V = require("../util/const");
import logger = require("../util/logger");
import ReVIEWRunner = require("../util/review-runner");

class ReVIEWSyntaxListView extends ScrollView {

    editorId: string;
    file: PathWatcher.IFile;
    editor: AtomCore.IEditor;

    runner: ReVIEWRunner;

    acceptableSyntaxes: ReVIEW.Build.AcceptableSyntaxes;

    static deserialize(state: any): ReVIEWSyntaxListView {
        return new ReVIEWSyntaxListView(state);
    }

    static content(): any {
        return this.div({ class: "review-syntax-list native-key-bindings", tabindex: -1 });
    }

    constructor(params: { editorId?: string; filePath?: string; } = {}) {
        super();

        this.editorId = params.editorId;

        if (this.editorId) {
            var promise = this.resolveEditor(this.editorId);
            promise.then(editor=> {
                this.runner = new ReVIEWRunner({ editor: editor });
                this.handleEvents();
            }).catch(reason=> {
                // The editor this preview was created for has been closed so close
                // this preview since a preview cannot be rendered without an editor
                var view = this.jq.parents(".pane").view();
                if (view) {
                    view.destroyItem(this);
                }
            });
        } else if (params.filePath) {
            this.file = new File(params.filePath);
            this.runner = new ReVIEWRunner({ file: this.file });
            this.handleEvents();
        } else {
            throw new Error("editorId or filePath are required");
        }
    }

    get jq(): JQuery {
        // dirty hack
        return <any>this;
    }

    serialize() {
        return {
            deserializer: "ReVIEWSyntaxListView",
            filePath: this.file ? this.getPath() : null,
            editorId: this.editorId
        };
    }

    destroy() {
        this.runner.deactivate();
    }

    resolveEditor(editorId: string): Q.Promise<AtomCore.IEditor> {
        var deferred = Q.defer<AtomCore.IEditor>();

        var resolve = () => {
            var editor = this.editorForId(editorId);
            this.editor = editor;

            if (editor) {
                this.jq.trigger("title-changed");
                deferred.resolve(editor);
            } else {
                deferred.reject(null);
            }
        };

        if (atom.workspace) {
            resolve();
        } else {
            atom.packages.onDidActivateInitialPackages(() => {
                resolve();
            });
        }
        return deferred.promise;
    }

    editorForId(editorId: string) {
        var foundEditors = atom.workspace.getTextEditors().filter(editor=> {
            var id = editor.id;
            if (!id) {
                return false;
            }
            return id.toString() === editorId.toString();
        });
        return foundEditors[0];
    }

    handleEvents() {
        atom.commands.add(<any>this, "core:move-up", () => this.jq.scrollUp());
        atom.commands.add(<any>this, "core:move-down", () => this.jq.scrollDown());

        atom.commands.add("atom-workspace", "language-review:zoom-in", () => {
            var zoomLevel = parseFloat(this.jq.css("zoom")) || 1;
            this.jq.css("zoom", zoomLevel + 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:zoom-out", () => {
            var zoomLevel = parseFloat(this.jq.css("zoom")) || 1;
            this.jq.css("zoom", zoomLevel - 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:reset-zoom", () => {
            this.jq.css("zoom", 1);
        });

        this.runner.on("syntax", acceptableSyntaxes=> {
            this.acceptableSyntaxes = acceptableSyntaxes;
            this.renderSyntaxList();
        });

        this.runner.activate();
    }

    renderSyntaxList() {
        if (!this.acceptableSyntaxes) {
            return;
        }

        var $div = $("<div>");
        $("<h1>").text("Re:VIEW記法の説明").appendTo($div);
        var SyntaxType = ReVIEW.Build.SyntaxType;
        this.acceptableSyntaxes.acceptableSyntaxes.forEach(syntax=> {
            var $syntax = $("<div>");
            switch (syntax.type) {
                case SyntaxType.Other:
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
                case SyntaxType.Inline:
                    $("<span>").text("@<" + syntax.symbolName + ">{}").appendTo($syntax);
                    break;
                case SyntaxType.Block:
                    syntax.argsLength.forEach(len=> {
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
    }

    getTitle(): string {
        if (this.file) {
            return path.basename(this.getPath()) + " Syntax List";
        } else if (this.editor) {
            return this.editor.getTitle() + " Syntax List";
        } else {
            return "Re:VIEW Syntax List";
        }
    }

    getURI(): string {
        if (this.file) {
            return "language-review://" + this.getPath();
        } else {
            return "language-review://" + V.syntaxListHost + "/" + this.editorId;
        }
    }

    getPath(): string {
        if (this.file) {
            return this.file.getPath();
        } else if (this.editor) {
            return this.editor.getPath();
        }
        return null;
    }
}

atom.deserializers.add(ReVIEWSyntaxListView);

export = ReVIEWSyntaxListView;
