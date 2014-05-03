/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />
/// <reference path="../typings/pathwatcher/pathwatcher.d.ts" />

/// <reference path="../node_modules/review.js/dist/review.js.d.ts" />

import path = require("path");
import _atom = require("atom");

var $ = _atom.$;
var $$$ = _atom.$$$;

import pathwatcher = require("pathwatcher");
var File = pathwatcher.File;

import ReVIEW = require("review.js");

import V = require("./const");

class ReVIEWPreviewView extends _atom.ScrollView {

	editorId:string;
	file:pathwatcher.IFile;
	editor:AtomCore.IEditor;

	static deserialize(state:any):ReVIEWPreviewView {
		return new ReVIEWPreviewView(state);
	}

	static content():any {
		return this.div({class: "review-preview native-key-bindings", tabindex: -1});
	}

	constructor(params:{editorId?:string; filePath?:string;} = {}) {
		super();

		this.editorId = params.editorId;

		if (this.editorId) {
			this.resolveEditor(this.editorId);
		} else {
			this.file = new File(params.filePath);
			this.handleEvents();
		}
	}

	get jq():JQuery {
		// dirty hack
		return <any>this;
	}

	serialize() {
		return {
			deserializer: "ReVIEWPreviewView",
			filePath: this.getPath(),
			editorId: this.editorId
		};
	}

	destroy() {
		this.unsubscribe();
	}

	resolveEditor(editorId:string) {
		var resolve = ()=> {
			this.editor = this.editorForId(editorId);

			if (this.editor) {
				this.jq.trigger("title-changed");
				this.handleEvents();
			} else {
				// The editor this preview was created for has been closed so close
				// this preview since a preview cannot be rendered without an editor
				var view = this.jq.parents(".pane").view();
				if (view) {
					view.destroyItem(this);
				}
			}
		};

		if (atom.workspace) {
			resolve();
		} else {
			atom.packages.once("activated", ()=> {
				resolve();
				this.renderReVIEW();
			});
		}
	}

	editorForId(editorId:string) {
		var foundEditors = atom.workspace.getEditors().filter(editor=> {
			var id = editor.id;
			if (!id) {
				return false;
			}
			return id.toString() === editorId.toString();
		});
		return foundEditors[0];
	}

	handleEvents() {
		this.subscribe(atom.syntax, "grammar-added grammar-updated", ()=> {
			setTimeout(()=> this.renderReVIEW(), 250);
		});
		this.subscribe(this, "core:move-up", ()=> this.jq.scrollUp());
		this.subscribe(this, "core:move-down", ()=> this.jq.scrollDown());

		this.subscribeToCommand(atom.workspaceView, "language-review:zoom-in", ()=> {
			var zoomLevel = parseFloat(this.jq.css("zoom")) || 1;
			this.jq.css("zoom", zoomLevel + 0.1);
		});
		this.subscribeToCommand(atom.workspaceView, "language-review:zoom-out", ()=> {
			var zoomLevel = parseFloat(this.jq.css("zoom")) || 1;
			this.jq.css("zoom", zoomLevel - 0.1);
		});
		this.subscribeToCommand(atom.workspaceView, "language-review:reset-zoom", ()=> {
			this.jq.css("zoom", 1);
		});

		var changeHandler = ()=> {
			this.renderReVIEW();
			var pane = atom.workspace.paneForUri(this.getUri());
			if (pane && pane !== atom.workspace.getActivePane()) {
				pane.activateItem(this);
			}
		};

		if (this.file) {
			this.subscribe(this.file, "contents-changed", changeHandler);
		} else if (this.editor) {
			this.subscribe(this.editor.getBuffer(), "contents-modified", changeHandler);
			this.subscribe(this.editor, "path-changed", () => this.jq.trigger("title-changed"));
		}
	}

	renderReVIEW() {
		this.showLoading();
		if (this.file) {
			this.file.read().then(contents=> this.renderReVIEWText(contents));
		} else if (this.editor) {
			this.renderReVIEWText(this.editor.getText());
		}
	}

	renderReVIEWText(text:string) {
		console.log(text);
		var sanitize = true;
		var breaks = atom.config.get("review-preview.breakOnSingleNewline");
		var files:{[path:string]:string;} = {
			"ch01.re": text
		};
		var result:{[path:string]:string;} = {
		};
		ReVIEW.start(review => {
			review.initConfig({
				read: path => files[path],
				write: (path, content) => result[path] = content,
				listener: {
					onReports: reports => console.log(reports),
					onCompileSuccess: book => {
						book.parts[1].chapters[0].builderProcesses.forEach(process => {
							var $html = this.resolveImagePaths(process.result);
							this.jq.empty().append($html);
						});
					},
					onCompileFailed: () => {
					}
				},
				builders: [new ReVIEW.Build.HtmlBuilder(false)],
				book: {
					preface: [],
					chapters: [
						"ch01.re"
					],
					afterword: []
				}
			});
		});
	}

	getTitle():string {
		if (this.file) {
			return path.basename(this.getPath()) + " Preview";
		} else if (this.editor) {
			return this.editor.getTitle() + " Preview";
		} else {
			return "Re:VIEW Preview";
		}
	}

	getUri():string {
		if (this.file) {
			return "language-review://" + this.getPath();
		} else {
			return "language-review://" + V.previewHost + "/" + this.editorId;
		}
	}

	getPath():string {
		if (this.file) {
			return this.file.getPath();
		} else {
			this.editor.getPath();
		}
	}

	showError(result:any = {}) {
		var failureMessage = result.message;

		this.jq.html($$$(function () {
			this.h2("Previewing Re:VIEW Failed");
			if (failureMessage) {
				return this.h3(failureMessage);
			}
		}));
	}

	showLoading() {
		this.jq.html($$$(function () {
			this.div({class: "review-spinner"}, "Loading Re:VIEW\u2026");
		}));
	}

	resolveImagePaths(html:any):JQuery {
		var $html = $(html);
		var imgList = $html.find("img");
		for (var i = 0; i < imgList.length; i++) {
			var img = $(imgList[i]);
			var src = img.attr("src");
			if (src.match(/^(https?:\/\/)/)) {
				continue;
			}
			img.attr("src", path.resolve(path.dirname(this.getPath()), src));
		}

		return $html;
	}
}

atom.deserializers.add(ReVIEWPreviewView);

export = ReVIEWPreviewView;
