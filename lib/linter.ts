import { Range } from "atom";

import * as ReVIEW from "review.js";
import ReVIEWRunner from "./util/review-runner";
import * as logger from "./util/logger";

interface LinterError {
    type: string;
    text?: string;
    html?: string;
    filePath?: string;
    range?: TextBuffer.IRange;
    trace?: {}[];
}

export default function linter(editor: AtomCore.IEditor): Promise<LinterError[]> {
    return new Promise((resolve, _reject) => {
        let reviewRunner = new ReVIEWRunner({ editor: editor });
        reviewRunner.on("report", reports => {
            logger.log("Re:VIEW linter ReVIEWRunner compile");
            reviewRunner.deactivate();
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
                default:
            }

            let range = syntaxTreeToRange(report.nodes[0]);
            return {
                type: type,
                text: report.message,
                filePath: editor.getPath(),
                range: range,
            };
        });
}

function syntaxTreeToRange(node: ReVIEW.NodeLocation): TextBuffer.IRange {
    return Range.fromObject({
        start: {
            row: node.location.start.line - 1,
            column: node.location.start.column - 1,
        },
        end: {
            row: node.location.start.line - 1,
            column: node.location.end ? node.location.end.column - 1 : node.location.start.column - 1,
        },
    });
}
