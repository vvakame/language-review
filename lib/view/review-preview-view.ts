import * as path from "path";

import { $, $$$, ScrollView } from "atom-space-pen-views";

import * as V from "../util/const";
import * as logger from "../util/logger";
import { ReportLevel } from "review.js";
import ReVIEWRunner from "../util/review-runner";

export default class ReVIEWPreviewView extends ScrollView {

    editorId: string;
    editor: AtomCore.IEditor;

    runner: ReVIEWRunner;

    fontSizeObserveSubscription: AtomCore.IDisposable;
    fontFamilyObserveSubscription: AtomCore.IDisposable;

    static deserialize(state: any): ReVIEWPreviewView {
        return new ReVIEWPreviewView(state);
    }

    static content(): any {
        return this.div({ class: "review-preview native-key-bindings", tabindex: -1 });
    }

    constructor(params: { editorId: string; }) {
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

    attached() {
        this.fontSizeObserveSubscription = atom.config.observe("editor.fontSize", newValue => {
            this.adjustFont({ fontSize: newValue });
        });
        this.fontFamilyObserveSubscription = atom.config.observe("editor.fontFamily", newValue => {
            this.adjustFont({ fontFamily: newValue });
        });
    }

    detached() {
        this.fontSizeObserveSubscription.dispose();
        this.fontSizeObserveSubscription = null;
        this.fontFamilyObserveSubscription.dispose();
        this.fontFamilyObserveSubscription = null;
    }

    adjustFont({fontSize, fontFamily}: { fontSize?: number; fontFamily?: string }) {
        fontSize = fontSize || atom.config.get("editor.fontSize");
        fontFamily = fontFamily || atom.config.get("editor.fontFamily");
        this.jq.css("font-family", fontFamily);
        this.jq.css("font-size", fontSize);
    }

    serialize() {
        return {
            deserializer: "ReVIEWPreviewView",
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

        let changeHandler = () => {
            let pane = atom.workspace.paneForURI(this.getURI());
            if (pane && pane !== atom.workspace.getActivePane()) {
                pane.activateItem(this);
            }
        };

        let savedScrollTop: number = 0;
        let inFailedContext = false;
        this.runner.on("start", () => {
            if (!inFailedContext) {
                savedScrollTop = this.jq.scrollTop();
            }
            this.showLoading();
        });
        this.runner.on("report", reports => {
            logger.log(reports);
        });
        this.runner.on("compile-success", book => {
            inFailedContext = false;
            changeHandler();
            book.allChunks[0].builderProcesses.forEach(process => {
                let $html = this.resolveImagePaths(process.result);
                this.jq.empty().append($html);
            });
            this.jq.scrollTop(savedScrollTop);
        });
        this.runner.on("compile-failed", book => {
            inFailedContext = true;
            changeHandler();
            let $result = $("<div>");
            book.allChunks[0].process.reports.forEach(report => {
                let $report = $("<div>");
                let type = "Unknown";
                switch (report.level) {
                    case ReportLevel.Error:
                        type = "Error";
                        $report.addClass("text-error");
                        break;
                    case ReportLevel.Warning:
                        type = "Warning";
                        $report.addClass("text-warning");
                        break;
                    case ReportLevel.Info:
                        type = "Info";
                        $report.addClass("text-info");
                        break;
                    default:
                }

                let line = report.nodes[0].location.start.line;
                let column = report.nodes[0].location.start.column - 1;
                $report.text(`[${line},${column}] ${type} ${report.message}`);
                $report.appendTo($result);
            });
            this.jq.empty().append($result);
        });

        this.runner.activate();

        if (this.runner.editor) {
            atom.commands.add("atom-text-editor", "path-changed", () => this.jq.trigger("title-changed"));
        }
    }

    renderReVIEW() {
        this.runner.doCompile();
    }

    getTitle(): string {
        if (this.editor) {
            return `${this.editor.getTitle()} Preview`;
        } else {
            return "Re:VIEW Preview";
        }
    }

    getURI(): string {
        return `language-review://${V.previewHost}/${this.editorId}`;
    }

    getPath(): string {
        if (this.editor) {
            return this.editor.getPath();
        }
        return null;
    }

    showError(result: any = {}) {
        let failureMessage = result.message;

        this.jq.html($$$(function(this: any) {
            this.h2("Previewing Re:VIEW Failed");
            if (failureMessage) {
                return this.h3(failureMessage);
            }
        }));
    }

    showLoading() {
        this.jq.html($$$(function(this: any) {
            this.div({ class: "review-spinner" }, "Loading Re:VIEW\u2026");
        }));
    }

    resolveImagePaths(html: any): JQuery {
        let $html = $(html);
        let imgList = $html.find("img");
        for (let i = 0; i < imgList.length; i++) {
            let img = $(imgList[i]);
            let src = img.attr("src");
            if (src.match(/^(https?:\/\/)/)) {
                continue;
            }
            img.attr("src", path.resolve(path.dirname(this.getPath()), src));
        }

        return $html;
    }
}

atom.deserializers.add(ReVIEWPreviewView);
