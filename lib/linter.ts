import fs = require("fs");

var Range = require("atom").Range;

import V = require("./util/const");
import ReVIEW = require("review.js");
import ReVIEWRunner = require("./util/review-runner");
import logger = require("./util/logger");

interface LinterError {
	type: string;
	text: string;
	filePath: string;
	range: TextBuffer.IRange;
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

function reportToLintMessage(editor: AtomCore.IEditor, reports:ReVIEW.ProcessReport[]): LinterError[] {
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

function syntaxTreeToRange(node: ReVIEW.Parse.SyntaxTree): TextBuffer.IRange {
	return Range.fromObject({
		start: {
			row: node.line - 1,
			column: node.column - 1
		},
		end: {
			row: node.line - 1,
			column: node.column - 1 + (node.endPos - node.offset)
		}
	});
}

export = linter;
