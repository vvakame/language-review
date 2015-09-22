import {SelectListView, $, $$} from "atom-space-pen-views";
import {Point} from "atom";

import ReVIEW = require("review.js");

// import V = require("../util/const");
import logger = require("../util/logger");
import ReVIEWRunner = require("../util/review-runner");

class ReVIEWOutlineView extends SelectListView {
    static activate() {
        new ReVIEWOutlineView();
    }

    constructor() {
        super();
        this.jq.addClass("review-outline overlay from-top");
    }

    get jq(): JQuery {
        // dirty hack
        return <any>this;
    }

    getFilterKey() {
        return "labelName";
    }

    toggle() {
        if (this.jq.hasParent()) {
            this.cancel();
        } else {
            this.attach();
        }
    }

    attach() {
        this.storeFocusedElement();

        var symbols: ReVIEW.Symbol[] = [];

        let editor = atom.workspace.getActiveTextEditor();
        let runner = new ReVIEWRunner({ editor: editor });
        runner.on("report", reports => {
            logger.log("Re:VIEW linter ReVIEWRunner compile");
            if (runner.lastSymbols) {
                let symbols = runner.lastSymbols.filter(symbol => symbol.symbolName === "hd");
                this.setItems(symbols);
            } else {
                logger.log("not compiled...");
                atom.beep();
            }
        });
        runner.doCompile();

        $(atom.views.getView(atom.workspace)).append(this.jq); // TODO is this implementation on the right way?
        this.focusFilterEditor();
    }

    cancelled() {
        this.jq.remove();
    }

    viewForItem(symbol: ReVIEW.Symbol): JQuery {
        var repeatString = (times: number, str: string, result = ""): string => {
            if (times === 0) {
                return result;
            } else {
                return repeatString(times - 1, str, result + str);
            }
        };

        var header: ReVIEW.HeadlineSyntaxTree = <any>symbol.node;
        var prefix = repeatString(header.level, "=");
        var text = prefix + " " + symbol.labelName;

        return $$(function() {
            // this eq View(class)
            this.li(() => {
                this.span(text);
            });
        });
    }

    confirmed(symbol: ReVIEW.Symbol) {
        // onSelected的な
        this.cancel();
        // emit したい…
        var pane: any = atom.workspace.getActivePane();
        if (!pane || typeof pane.getActiveEditor !== "function") {
            atom.beep();
            return;
        }
        var editor: AtomCore.IEditor = pane.getActiveEditor();
        var point = Point.fromObject({ row: symbol.node.location.start.line - 1, column: 0 });
        editor.setCursorBufferPosition(point);
    }
}

export = ReVIEWOutlineView;
