"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var atom_space_pen_views_1 = require("atom-space-pen-views");
var V = require("../util/const");
var logger = require("../util/logger");
var review_js_1 = require("review.js");
var review_runner_1 = require("../util/review-runner");
var ReVIEWPreviewView = (function (_super) {
    __extends(ReVIEWPreviewView, _super);
    function ReVIEWPreviewView(params) {
        var _this = this;
        _super.call(this);
        this.editorId = params.editorId;
        if (this.editorId) {
            var promise = this.resolveEditor(this.editorId);
            promise.then(function (editor) {
                _this.runner = new review_runner_1.default({ editor: editor });
                _this.handleEvents();
            }).catch(function (_reason) {
                // The editor this preview was created for has been closed so close
                // this preview since a preview cannot be rendered without an editor
                var view = _this.jq.parents(".pane").view();
                if (view) {
                    view.destroyItem(_this);
                }
            });
        }
        else {
            throw new Error("editorId is required");
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
    ReVIEWPreviewView.prototype.attached = function () {
        var _this = this;
        this.fontSizeObserveSubscription = atom.config.observe("editor.fontSize", function (newValue) {
            _this.adjustFont({ fontSize: newValue });
        });
        this.fontFamilyObserveSubscription = atom.config.observe("editor.fontFamily", function (newValue) {
            _this.adjustFont({ fontFamily: newValue });
        });
    };
    ReVIEWPreviewView.prototype.detached = function () {
        this.fontSizeObserveSubscription.dispose();
        this.fontSizeObserveSubscription = null;
        this.fontFamilyObserveSubscription.dispose();
        this.fontFamilyObserveSubscription = null;
    };
    ReVIEWPreviewView.prototype.adjustFont = function (_a) {
        var fontSize = _a.fontSize, fontFamily = _a.fontFamily;
        fontSize = fontSize || atom.config.get("editor.fontSize");
        fontFamily = fontFamily || atom.config.get("editor.fontFamily");
        this.jq.css("font-family", fontFamily);
        this.jq.css("font-size", fontSize);
    };
    ReVIEWPreviewView.prototype.serialize = function () {
        return {
            deserializer: "ReVIEWPreviewView",
            filePath: null,
            editorId: this.editorId,
        };
    };
    ReVIEWPreviewView.prototype.destroy = function () {
        if (this.runner) {
            // https://github.com/vvakame/language-review/issues/54#issuecomment-210971891
            this.runner.deactivate();
        }
    };
    ReVIEWPreviewView.prototype.resolveEditor = function (editorId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var func = function () {
                var editor = _this.editorForId(editorId);
                _this.editor = editor;
                if (editor) {
                    _this.jq.trigger("title-changed");
                    resolve(editor);
                }
                else {
                    reject();
                }
            };
            if (atom.workspace) {
                func();
            }
            else {
                atom.packages.onDidActivateInitialPackages(function () {
                    func();
                });
            }
        });
    };
    ReVIEWPreviewView.prototype.editorForId = function (editorId) {
        var foundEditors = atom.workspace.getTextEditors().filter(function (editor) {
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
        atom.commands.add(this, "core:move-up", function () { return _this.jq.scrollUp(); });
        atom.commands.add(this, "core:move-down", function () { return _this.jq.scrollDown(); });
        atom.commands.add("atom-workspace", "language-review:zoom-in", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel + 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:zoom-out", function () {
            var zoomLevel = parseFloat(_this.jq.css("zoom")) || 1;
            _this.jq.css("zoom", zoomLevel - 0.1);
        });
        atom.commands.add("atom-workspace", "language-review:reset-zoom", function () {
            _this.jq.css("zoom", 1);
        });
        var changeHandler = function () {
            var pane = atom.workspace.paneForURI(_this.getURI());
            if (pane && pane !== atom.workspace.getActivePane()) {
                pane.activateItem(_this);
            }
        };
        var savedScrollTop = 0;
        var inFailedContext = false;
        this.runner.on("start", function () {
            if (!inFailedContext) {
                savedScrollTop = _this.jq.scrollTop();
            }
            _this.showLoading();
        });
        this.runner.on("report", function (reports) {
            logger.log(reports);
        });
        this.runner.on("compile-success", function (book) {
            inFailedContext = false;
            changeHandler();
            book.allChunks[0].builderProcesses.forEach(function (process) {
                var $html = _this.resolveImagePaths(process.result);
                _this.jq.empty().append($html);
            });
            _this.jq.scrollTop(savedScrollTop);
        });
        this.runner.on("compile-failed", function (book) {
            inFailedContext = true;
            changeHandler();
            var $result = atom_space_pen_views_1.$("<div>");
            book.allChunks[0].process.reports.forEach(function (report) {
                var $report = atom_space_pen_views_1.$("<div>");
                var type = "Unknown";
                switch (report.level) {
                    case review_js_1.ReportLevel.Error:
                        type = "Error";
                        $report.addClass("text-error");
                        break;
                    case review_js_1.ReportLevel.Warning:
                        type = "Warning";
                        $report.addClass("text-warning");
                        break;
                    case review_js_1.ReportLevel.Info:
                        type = "Info";
                        $report.addClass("text-info");
                        break;
                    default:
                }
                var line = report.nodes[0].location.start.line;
                var column = report.nodes[0].location.start.column - 1;
                $report.text("[" + line + "," + column + "] " + type + " " + report.message);
                $report.appendTo($result);
            });
            _this.jq.empty().append($result);
        });
        this.runner.activate();
        if (this.runner.editor) {
            atom.commands.add("atom-text-editor", "path-changed", function () { return _this.jq.trigger("title-changed"); });
        }
    };
    ReVIEWPreviewView.prototype.renderReVIEW = function () {
        this.runner.doCompile();
    };
    ReVIEWPreviewView.prototype.getTitle = function () {
        if (this.editor) {
            return this.editor.getTitle() + " Preview";
        }
        else {
            return "Re:VIEW Preview";
        }
    };
    ReVIEWPreviewView.prototype.getURI = function () {
        return "language-review://" + V.previewHost + "/" + this.editorId;
    };
    ReVIEWPreviewView.prototype.getPath = function () {
        if (this.editor) {
            return this.editor.getPath();
        }
        return null;
    };
    ReVIEWPreviewView.prototype.showError = function (result) {
        if (result === void 0) { result = {}; }
        var failureMessage = result.message;
        this.jq.html(atom_space_pen_views_1.$$$(function () {
            this.h2("Previewing Re:VIEW Failed");
            if (failureMessage) {
                return this.h3(failureMessage);
            }
        }));
    };
    ReVIEWPreviewView.prototype.showLoading = function () {
        this.jq.html(atom_space_pen_views_1.$$$(function () {
            this.div({ class: "review-spinner" }, "Loading Re:VIEW\u2026");
        }));
    };
    ReVIEWPreviewView.prototype.resolveImagePaths = function (html) {
        var $html = atom_space_pen_views_1.$(html);
        var imgList = $html.find("img");
        for (var i = 0; i < imgList.length; i++) {
            var img = atom_space_pen_views_1.$(imgList[i]);
            var src = img.attr("src");
            if (src.match(/^(https?:\/\/)/)) {
                continue;
            }
            img.attr("src", path.resolve(path.dirname(this.getPath()), src));
        }
        return $html;
    };
    return ReVIEWPreviewView;
}(atom_space_pen_views_1.ScrollView));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReVIEWPreviewView;
atom.deserializers.add(ReVIEWPreviewView);
//# sourceMappingURL=review-preview-view.js.map