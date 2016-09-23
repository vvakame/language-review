"use strict";
var atom_1 = require("atom");
var ReVIEW = require("review.js");
var review_runner_1 = require("./util/review-runner");
var logger = require("./util/logger");
function linter(editor) {
    return new Promise(function (resolve, _reject) {
        var reviewRunner = new review_runner_1.default({ editor: editor });
        reviewRunner.on("report", function (reports) {
            logger.log("Re:VIEW linter ReVIEWRunner compile");
            reviewRunner.deactivate();
            resolve(reportToLintMessage(editor, reports));
        });
        reviewRunner.startWatching();
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = linter;
function reportToLintMessage(editor, reports) {
    return reports
        .filter(function (report) { return report.level !== ReVIEW.ReportLevel.Info; })
        .map(function (report) {
        var type;
        switch (report.level) {
            case ReVIEW.ReportLevel.Error:
                type = "Error";
                break;
            case ReVIEW.ReportLevel.Warning:
                type = "Warning";
                break;
            default:
        }
        var range = syntaxTreeToRange(report.nodes[0]);
        return {
            type: type,
            text: report.message,
            filePath: editor.getPath(),
            range: range,
        };
    });
}
function syntaxTreeToRange(node) {
    return atom_1.Range.fromObject({
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
//# sourceMappingURL=linter.js.map