import * as url from "url";

import * as apd from "atom-package-deps";

import * as V from "./util/const";
import * as logger from "./util/logger";
import linter from "./linter";
import ReVIEWPreviewView from "./view/review-preview-view";
import ReVIEWOutlineView from "./view/review-outline-view";
import ReVIEWSyntaxListView from "./view/review-syntax-list-view";

class Controller {
    config = {
        debug: {
            title: "Debug: language-review. please do not use this option.",
            type: "boolean",
            default: false,
        },
        grammar: {
            title: "grammer scope. please do not change this option.",
            type: "string",
            default: V.reviewScopeName,
        },
    };

    editorViewSubscription: { off(): any; };
    outlineView: ReVIEWOutlineView;

    provideLinter() {
        return {
            name: "review.js",
            grammarScopes: [V.reviewScopeName],
            scope: "file", // or "project"
            lintOnFly: false,
            lint: linter,
        };
    }

    activate(): void {
        apd.install("language-review").then(() => {
            logger.log("dependency installed");
        });
        this.readyToActivate();
    }

    readyToActivate() {
        atom.commands.add("atom-workspace", V.protocol + "toggle-preview", () => {
            this.togglePreview();
        });
        atom.commands.add("atom-workspace", V.protocol + "toggle-outline", () => {
            this.toggleOutline();
        });
        atom.commands.add("atom-workspace", V.protocol + "toggle-syntax-list", () => {
            this.toggleSyntaxList();
        });

        atom.workspace.addOpener((urlToOpen: string): View => {
            logger.log(urlToOpen);
            let tmpUrl = url.parse(urlToOpen);

            let pathName = tmpUrl.pathname;
            if (pathName) {
                pathName = decodeURI(pathName);
            }

            let protocol = tmpUrl.protocol;
            if (protocol !== V.protocol) {
                return null;
            }
            let host = tmpUrl.host;
            if (host === V.previewHost) {
                return new ReVIEWPreviewView({ editorId: pathName.substring(1) });
            } else if (host === V.syntaxListHost) {
                return new ReVIEWSyntaxListView({ editorId: pathName.substring(1) });
            }
            return null;
        });
    }

    deactivate() {
    }

    togglePreview(): void {
        let editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
            return;
        }

        if (atom.config.get("language-review.grammar") !== editor.getGrammar().scopeName) {
            return;
        }

        let uri = `${V.protocol}//${V.previewHost}/${editor.id}`;

        let previewPane = atom.workspace.paneForURI(uri);

        if (previewPane) {
            previewPane.destroyItem(previewPane.itemForURI(uri));
            return;
        }

        let previousActivePane = atom.workspace.getActivePane();

        atom.workspace.open(uri, {
            split: "right",
            searchAllPanes: true,
        }).then(view => {
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
        let editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
            return;
        }

        if (atom.config.get("language-review.grammar") !== editor.getGrammar().scopeName) {
            return;
        }

        let uri = `${V.protocol}//${V.syntaxListHost}/${editor.id}`;

        let previewPane = atom.workspace.paneForURI(uri);

        if (previewPane) {
            previewPane.destroyItem(previewPane.itemForURI(uri));
            return;
        }

        let previousActivePane = atom.workspace.getActivePane();

        atom.workspace.open(uri, {
            split: "right",
            searchAllPanes: true,
        }).done(view => {
            if (view instanceof ReVIEWSyntaxListView) {
                (<ReVIEWSyntaxListView>view).renderSyntaxList();
                previousActivePane.activate();
            }
        });
    }
}

let controller: any = new Controller();
export = controller;
