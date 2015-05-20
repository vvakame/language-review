import fs = require("fs");

var Range = require("atom").Range;

import V = require("./util/const");
import ReVIEW = require("review.js");
import ReVIEWRunner = require("./util/review-runner");
import logger = require("./util/logger");

interface LinterError {
    message: string;
    line: number; // startline.
    range: any; // LinterRange([startline,startch],[endline,endch]);
    level: string; // 'error' | 'warning'
    linter: string; // linter name
}

var linterPath = atom.packages.getLoadedPackage("linter").path;
@replace(require(linterPath + "/lib/linter"))
class Linter {
    constructor(public editor: AtomCore.IEditor) {
    }
}

class LinterReVIEW extends Linter {
    static syntax = [V.reviewScopeName];
    linterName = "Re:VIEW lint";

    reviewRunner: ReVIEWRunner;
    pendingReports: ReVIEW.ProcessReport[];

    constructor(editor: AtomCore.IEditor) {
        super(editor);

        this.reviewRunner = new ReVIEWRunner({ editor: this.editor });
        this.reviewRunner.on("report", reports=> {
            logger.log("Re:VIEW linter ReVIEWRunner compile");
            this.pendingReports = reports;
            // identify atom-text-editor w/o relying on jQuery
            atom.commands.dispatch(document.getElementsByTagName("atom-text-editor")[0], "linter:lint");
        });
        this.reviewRunner.startWatching();
    }

    lintFile(filePath: string, callback: (errors: LinterError[]) => any): void {
        if (!this.pendingReports) {
            callback([]);
            return;
        }

        callback(this.pendingReports
            .filter(report => report.level !== ReVIEW.ReportLevel.Info)
            .map((report): LinterError => {
            let level: string;
            switch (report.level) {
                case ReVIEW.ReportLevel.Error:
                    level = "error";
                    break;
                case ReVIEW.ReportLevel.Warning:
                    level = "warning";
                    break;
            }

            let range = this.syntaxTreeToRange(report.nodes[0]);

            return {
                message: report.message,
                line: range.start.row + 1,
                range: range,
                level: level,
                linter: "Re:VIEW"
            };
        }));
    }

    syntaxTreeToRange(node: ReVIEW.Parse.SyntaxTree): any {
        var range = Range.fromObject({
            start: {
                row: node.line - 1,
                column: node.column - 1
            },
            end: {
                row: node.line - 1,
                column: node.column - 1 + (node.endPos - node.offset)
            }
        });
        return range;
    }
}

export = LinterReVIEW;

function replace(src: any) {
    return () => src;
}
