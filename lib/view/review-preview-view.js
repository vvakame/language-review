/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/pathwatcher/pathwatcher.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />
var path = require("path");
var _atom = require("atom");

var $ = _atom.$;
var $$$ = _atom.$$$;

var pathwatcher = require("pathwatcher");
var File = pathwatcher.File;

var ReVIEW = require("review.js");

var V = require("../util/const");

var ReVIEWPreviewView = (function (_super) {
    __extends(ReVIEWPreviewView, _super);
    function ReVIEWPreviewView(params) {
        if (typeof params === "undefined") { params = {}; }
        _super.call(this);

        this.editorId = params.editorId;

        if (this.editorId) {
            this.resolveEditor(this.editorId);
        } else {
            this.file = new File(params.filePath);
            this.handleEvents();
        }
    }
    ReVIEWPreviewView.deserialize = function (state) {
        return new ReVIEWPreviewView(state);
    };

    ReVIEWPreviewView.content = function () {
        return this.div({ class: "review-preview native-key-bindings", tabindex: -1 });
    };

    Object.defineProperty(ReVIEWPreviewView.prototype, "jq", {
        get: function () {
            // dirty hack
            return this;
        },
        enumerable: true,
        configurable: true
    });

    ReVIEWPreviewView.prototype.serialize = function () {
        return {
            deserializer: "ReVIEWPreviewView",
            filePath: this.getPath(),
            editorId: this.editorId
        };
    };

    ReVIEWPreviewView.prototype.destroy = function () {
        this.unsubscribe();
    };

    ReVIEWPreviewView.prototype.resolveEditor = function (editorId) {
        var _this = this;
        var resolve = function () {
            _this.editor = _this.editorForId(editorId);

            if (_this.editor) {
                _this.jq.trigger("title-changed");
                _this.handleEvents();
            } else {
                // The editor this preview was created for has been closed so close
                // this preview since a preview cannot be rendered without an editor
                var view = _this.jq.parents(".pane").view();
                if (view) {
                    view.destroyItem(_this);
                }
            }
        };

        if (atom.workspace) {
            resolve();
        } else {
            atom.packages.once("activated", function () {
                resolve();
                _this.renderReVIEW();
            });
        }
    };

    ReVIEWPreviewView.prototype.editorForId = function (editorId) {
        var foundEditors = atom.workspace.getEditors().filter(function (editor) {
            var id = editor.id;
            if (!id) {
                return false;
            }
            return id.toString() === editorId.toString();
        });
        return foundEditors[0];
    };

    ReVIEWPreviewView.prototype.handleEvents = function () {
        var _this = this;
        this.subscribe(atom.syntax, "grammar-added grammar-updated", function () {
            setTimeout(function () {
                return _this.renderReVIEW();
            }, 250);
        });
        this.subscribe(this, "core:move-up", function () {
            return _this.jq.scrollUp();
        });
        this.subscribe(this, "core:move-down", function () {
            return _this.jq.scrollDown();
        });

        this.subscribeToCommand(atom.workspaceView, "language-review:zoom-in", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel + 0.1);
        });
        this.subscribeToCommand(atom.workspaceView, "language-review:zoom-out", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel - 0.1);
        });
        this.subscribeToCommand(atom.workspaceView, "language-review:reset-zoom", function () {
            _this.jq.css("zoom", 1);
        });

        var changeHandler = function () {
            _this.renderReVIEW();
            var pane = atom.workspace.paneForUri(_this.getUri());
            if (pane && pane !== atom.workspace.getActivePane()) {
                pane.activateItem(_this);
            }
        };

        if (this.file) {
            this.subscribe(this.file, "contents-changed", changeHandler);
        } else if (this.editor) {
            this.subscribe(this.editor.getBuffer(), "contents-modified", changeHandler);
            this.subscribe(this.editor, "path-changed", function () {
                return _this.jq.trigger("title-changed");
            });
        }
    };

    ReVIEWPreviewView.prototype.renderReVIEW = function () {
        var _this = this;
        this.showLoading();
        if (this.file) {
            this.file.read().then(function (contents) {
                return _this.renderReVIEWText(contents);
            });
        } else if (this.editor) {
            this.renderReVIEWText(this.editor.getText());
        }
    };

    ReVIEWPreviewView.prototype.renderReVIEWText = function (text) {
        var _this = this;
        var files = {
            "ch01.re": text
        };
        var result = {};
        ReVIEW.start(function (review) {
            review.initConfig({
                read: function (path) {
                    return files[path];
                },
                write: function (path, content) {
                    return result[path] = content;
                },
                listener: {
                    onReports: function (reports) {
                        return console.log(reports);
                    },
                    onCompileSuccess: function (book) {
                        book.parts[1].chapters[0].builderProcesses.forEach(function (process) {
                            var $html = _this.resolveImagePaths(process.result);
                            _this.jq.empty().append($html);
                        });
                    },
                    onCompileFailed: function () {
                        // NOTE: ここ消すとreview.js内部で process.exit(1); される
                        false;
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
    };

    ReVIEWPreviewView.prototype.getTitle = function () {
        if (this.file) {
            return path.basename(this.getPath()) + " Preview";
        } else if (this.editor) {
            return this.editor.getTitle() + " Preview";
        } else {
            return "Re:VIEW Preview";
        }
    };

    ReVIEWPreviewView.prototype.getUri = function () {
        if (this.file) {
            return "language-review://" + this.getPath();
        } else {
            return "language-review://" + V.previewHost + "/" + this.editorId;
        }
    };

    ReVIEWPreviewView.prototype.getPath = function () {
        if (this.file) {
            return this.file.getPath();
        } else {
            this.editor.getPath();
        }
    };

    ReVIEWPreviewView.prototype.showError = function (result) {
        if (typeof result === "undefined") { result = {}; }
        var failureMessage = result.message;

        this.jq.html($$$(function () {
            this.h2("Previewing Re:VIEW Failed");
            if (failureMessage) {
                return this.h3(failureMessage);
            }
        }));
    };

    ReVIEWPreviewView.prototype.showLoading = function () {
        this.jq.html($$$(function () {
            this.div({ class: "review-spinner" }, "Loading Re:VIEW\u2026");
        }));
    };

    ReVIEWPreviewView.prototype.resolveImagePaths = function (html) {
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
    };
    return ReVIEWPreviewView;
})(_atom.ScrollView);

atom.deserializers.add(ReVIEWPreviewView);

module.exports = ReVIEWPreviewView;
//# sourceMappingURL=review-preview-view.js.map
