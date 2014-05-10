/// <reference path="../../typings/atom/atom.d.ts" />

import _atom = require("atom");
import ReVIEWResultView = require("../view/review-result-view");

export var protocol = "language-review:";
export var previewHost = "preview";
export var reviewScopeName = "source.review";

export interface IReVIEWedEditorView extends _atom.EditorView {
	reviewResultView: ReVIEWResultView;
}
