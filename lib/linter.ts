import fs = require("fs");

var Range = require("atom").Range;

import V = require("./util/const");
import ReVIEW = require("review.js");
import ReVIEWRunner = require("./util/review-runner");
import logger = require("./util/logger");

interface LinterError {
    type: string;
    text?: string;
    html?: string;
    filePath?: string;
    range?: TextBuffer.IRange;
    trace?: {}[];
}

function linter(editor: AtomCore.IEditor): Promise<LinterError[]> {
    return new Promise((resolve, reject) => {
        let reviewRunner = new ReVIEWRunner({ editor: editor });
        reviewRunner.on("report", reports=> {
            logger.log("Re:VIEW linter ReVIEWRunner compile");
            resolve(reportToLintMessage(editor, reports));
        });
        reviewRunner.startWatching();
    });
}

function reportToLintMessage(editor: AtomCore.IEditor, reports: ReVIEW.ProcessReport[]): LinterError[] {
    return reports
        .filter(report => report.level !== ReVIEW.ReportLevel.Info)
        .map((report): LinterError => {
            let type: string;
            switch (report.level) {
                case ReVIEW.ReportLevel.Error:
                    type = "Error";
                    break;
                case ReVIEW.ReportLevel.Warning:
                    type = "Warning";
                    break;
            }

            let range = syntaxTreeToRange(report.nodes[0]);
            return {
                type: type,
                text: report.message,
                filePath: editor.getPath(),
                range: range
            };
        });
}

function syntaxTreeToRange(node: ReVIEW.NodeLocation): TextBuffer.IRange {
    return Range.fromObject({
        start: {
            row: node.location.start.line - 1,
            column: node.location.start.column - 1
        },
        end: {
            row: node.location.start.line - 1,
            column: node.location.end ? node.location.end.column - 1 : node.location.start.column - 1
        }
    });
}

export = linter;
