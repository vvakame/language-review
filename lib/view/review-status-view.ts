/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/emissary/emissary.d.ts" />

/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />

// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-status-view.coffee

import _atom = require("atom");

import ReVIEW = require("review.js");

import V = require("../util/const");
import ReVIEWRunner = require("../util/review-runner");

class ReVIEWStatusView extends _atom.View {

	static content():any {
		return this.div({class: "review-status inline-block"}, ()=> {
			this.span({class: "review-name"});
			this.span({class: "review-summary"});
		});
	}

	subscription:Emissary.ISubscription;

	constructor(public statusBarView:any) {
		super();

		this.subscribeToReVIEWRunner();
		this.update();

		this.subscribe(this.statusBarView, "active-buffer-changed", ()=> {
			this.unsubscribeFromReVIEWRunner();
			this.subscribeToReVIEWRunner();
			this.update();
		});
	}

	get jq():JQuery {
		// dirty hack
		return <any>this;
	}

	getActiveReVIEWRunner():ReVIEWRunner {
		var editorView = atom.workspaceView.getActiveView();
		if (!editorView) {
			// EditorView1つも開いてないパターン
			return null;
		}
		var reviewResultView = (<V.IReVIEWedEditorView>editorView).reviewResultView;
		if (reviewResultView && reviewResultView.reviewRunner) {
			return reviewResultView.reviewRunner;
		} else {
			return null;
		}
	}

	subscribeToReVIEWRunner() {
		var activeRunner = this.getActiveReVIEWRunner();
		if (!activeRunner) {
			return;
		}
		this.subscription = activeRunner.on("activate deactivate compile", (reports:ReVIEW.ProcessReport[]) => {
			this.update(reports);
		});
	}

	unsubscribeFromReVIEWRunner() {
		if (this.subscription) {
			this.subscription.off();
		}
		this.subscription = null;
	}

	update(reports?:ReVIEW.ProcessReport[]) {
		var view = this.statusBarView.getActiveItem();
		var grammarName:string;
		if (view && typeof view.getGrammar === "function") {
			grammarName = view.getGrammar().scopeName;
		}
		if (V.reviewScopeName === grammarName) {
			this.displayName("Re:VIEW");
			if (!reports) {
				// 他のファイルの編集から戻ってきた時 active-buffer-changed
				reports = this.getActiveReVIEWRunner().lastReports;
			}
			this.displaySummary(reports);
		} else {
			// Re:VIEW文書じゃないのでサクっと非表示
			this.displayName();
			this.displaySummary();
		}
	}

	displayName(text:string = "") {
		this.jq.find(".review-name").text(text);
	}

	displaySummary(reports?:ReVIEW.ProcessReport[]) {
		var countReport = (level:ReVIEW.ReportLevel, reports:ReVIEW.ProcessReport[] = []) => {
			return reports.filter(report => report.level === level).length;
		};

		var html = "";
		if (reports) {
			if (reports.length === 0) {
				html += "<span class=\"icon icon-check review-clean\"></span>";
			} else {
				var errorCount = countReport(ReVIEW.ReportLevel.Error, reports);
				if (errorCount > 0) {
					html += "<span class=\"icon icon-alert review-error\">" + errorCount + "</span>";
				}
				var warningCount = countReport(ReVIEW.ReportLevel.Warning, reports);
				if (warningCount > 0) {
					html += "<span class=\"icon icon-alert review-warning\">" + warningCount + "</span>";
				}
				var infoCount = countReport(ReVIEW.ReportLevel.Info, reports);
				if (infoCount > 0) {
					html += "<span class=\"icon icon-alert review-info\">" + infoCount + "</span>";
				}
			}
		}

		this.jq.find(".review-summary").html(html);
	}
}

export = ReVIEWStatusView;
