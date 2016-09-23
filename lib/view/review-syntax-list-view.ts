// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-view.coffee

import { $, ScrollView } from "atom-space-pen-views";

import * as ReVIEW from "review.js";

import * as V from "../util/const";
import * as logger from "../util/logger";
import ReVIEWRunner from "../util/review-runner";

export default class ReVIEWSyntaxListView extends ScrollView {

    editorId: string;
    editor: AtomCore.IEditor;

    runner: ReVIEWRunner;

    acceptableSyntaxes: ReVIEW.AcceptableSyntaxes;

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
            let promise = this.resolveEditor(this.editorId);
            promise.then(editor => {
                this.runner = new ReVIEWRunner({ editor: editor });
                this.handleEvents();
            }).catch(_reason => {
                // The editor this preview was created for has been closed so close
                // this preview since a preview cannot be rendered without an editor
                let view = this.jq.parents(".pane").view();
                if (view) {
                    view.destroyItem(this);
                }
            });
        } else {
            throw new Error("editorId is required");
        }
    }

    get jq(): JQuery {
        // dirty hack
        return <any>this;
    }

    serialize() {
        return {
            deserializer: "ReVIEWSyntaxListView",
            filePath: null as string,
            editorId: this.editorId,
        };
    }

    destroy() {
        if (this.runner) {
            // https://github.com/vvakame/language-review/issues/54#issuecomment-210971891
            this.runner.deactivate();
        }
    }

    resolveEditor(editorId: string): Promise<AtomCore.IEditor> {
        return new Promise<AtomCore.IEditor>((resolve, reject) => {
            let func = () => {
                let editor = this.editorForId(editorId);
                this.editor = editor;

                if (editor) {
                    this.jq.trigger("title-changed");
                    resolve(editor);
                } else {
                    reject();
                }
            };

            if (atom.workspace) {
                func();
            } else {
                atom.packages.onDidActivateInitialPackages(() => {
                    func();
                });
            }
        });
    }

    editorForId(editorId: string) {
        let foundEditors = atom.workspace.getTextEditors().filter(editor => {
            let id = editor.id;
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
            let zoomLevel = parseFloat(this.jq.css("zoom")) || 1;
            this.jq.css("zoom", zoomLevel + 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:zoom-out", () => {
            let zoomLevel = parseFloat(this.jq.css("zoom")) || 1;
            this.jq.css("zoom", zoomLevel - 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:reset-zoom", () => {
            this.jq.css("zoom", 1);
        });

        this.runner.on("syntax", acceptableSyntaxes => {
            this.acceptableSyntaxes = acceptableSyntaxes;
            this.renderSyntaxList();
        });

        this.runner.activate();
    }

    renderSyntaxList() {
        if (!this.acceptableSyntaxes) {
            return;
        }

        let $div = $("<div>");
        $("<h1>").text("Re:VIEW記法の説明").appendTo($div);
        /* tslint:disable:variable-name */
        let SyntaxType = ReVIEW.SyntaxType;
        /* tslint:enable:variable-name */
        this.acceptableSyntaxes.acceptableSyntaxes.forEach(syntax => {
            let $syntax = $("<div>");
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
                    syntax.argsLength.forEach(len => {
                        let text = "//" + syntax.symbolName;
                        for (let i = 0; i < len; i++) {
                            text += "[???]";
                        }
                        $("<div>").text(text).appendTo($syntax);
                    });
                    break;
                default:
            }
            let $description = $("<pre>").text(syntax.description);
            $description.appendTo($syntax);
            $syntax.append("<hr>");
            $syntax.appendTo($div);
            $syntax.data("syntax", syntax);
        });
        this.jq.empty();
        this.jq.append($div);
    }

    getTitle(): string {
        if (this.editor) {
            return `${this.editor.getTitle()} Syntax List`;
        } else {
            return "Re:VIEW Syntax List";
        }
    }

    getURI(): string {
        return `language-review://${V.syntaxListHost}/${this.editorId}`;
    }

    getPath(): string {
        if (this.editor) {
            return this.editor.getPath();
        }
        return null;
    }
}

atom.deserializers.add(ReVIEWSyntaxListView);
