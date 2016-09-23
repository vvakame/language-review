// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-runner.coffee
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var emissary_helper_1 = require("./emissary-helper");
var V = require("./const");
var logger = require("./logger");
var ReVIEW = require("review.js");
var path = require("path");
var fs = require("fs");
var PrhValidator = require("reviewjs-prh");
// 別の.reを参照する構文を生かしておくとビルドエラーになるので潰しておく。
var SingleFileAnalyzer = (function (_super) {
    __extends(SingleFileAnalyzer, _super);
    function SingleFileAnalyzer() {
        _super.apply(this, arguments);
    }
    SingleFileAnalyzer.prototype.inline_chap = function (builder) {
        this.inlineDecorationSyntax(builder, "chap");
    };
    SingleFileAnalyzer.prototype.inline_title = function (builder) {
        this.inlineDecorationSyntax(builder, "title");
    };
    SingleFileAnalyzer.prototype.inline_chapref = function (builder) {
        this.inlineDecorationSyntax(builder, "chapref");
    };
    return SingleFileAnalyzer;
}(ReVIEW.DefaultAnalyzer));
// 別の.reを参照する構文を生かしておくとビルドエラーになるので潰しておく。
var SingleFileHTMLBuilder = (function (_super) {
    __extends(SingleFileHTMLBuilder, _super);
    function SingleFileHTMLBuilder() {
        _super.apply(this, arguments);
    }
    SingleFileHTMLBuilder.prototype.inline_chap = function (process, _node) {
        process.out("第X章");
        return false;
    };
    SingleFileHTMLBuilder.prototype.inline_title = function (process, _node) {
        process.out("章タイトル(仮)");
        return false;
    };
    SingleFileHTMLBuilder.prototype.inline_chapref = function (process, _node) {
        process.out("第X章「章タイトル(仮)」");
        return false;
    };
    return SingleFileHTMLBuilder;
}(ReVIEW.HtmlBuilder));
var ReVIEWRunner = (function (_super) {
    __extends(ReVIEWRunner, _super);
    function ReVIEWRunner(params) {
        _super.call(this);
        this.editor = params.editor;
        if (this.editor) {
            this.watcher = new EditorContentWatcher(this, this.editor);
        }
        else {
            throw new Error("editor is required");
        }
    }
    ReVIEWRunner.prototype.startWatching = function () {
        logger.log();
        this.watcher.startWatching();
    };
    ReVIEWRunner.prototype.stopWatching = function () {
        logger.log();
        this.watcher.stopWatching();
    };
    ReVIEWRunner.prototype.activate = function () {
        logger.log();
        this.watcher.activate();
    };
    ReVIEWRunner.prototype.deactivate = function () {
        logger.log();
        this.watcher.deactivate();
    };
    // 後でReVIEWRunner.emissarified();している。特殊化されたオーバーロードのため。
    ReVIEWRunner.prototype.on = function (_eventNames, _handler) {
        throw new Error();
    };
    ReVIEWRunner.prototype.doCompile = function () {
        var _this = this;
        logger.log();
        this.emit("start");
        var currentPath = this.watcher.getFilePath() || "ch01.re";
        var basePath = path.isAbsolute(currentPath) ? path.dirname(currentPath) : undefined;
        var filename = path.basename(currentPath);
        setTimeout(function () {
            var files = {};
            files[filename] = _this.watcher.getContent();
            var result = {};
            var validators = [
                new ReVIEW.DefaultValidator(),
            ];
            var dirName;
            if (_this.editor) {
                dirName = _this.editor.getBuffer().file.getParent().getPath();
            }
            var prhFilePath = path.join(dirName, "prh.yml");
            if (fs.existsSync(prhFilePath)) {
                try {
                    validators.push(new PrhValidator.TextValidator(prhFilePath));
                }
                catch (e) {
                    atom.notifications.addWarning("prh.ymlの定義に誤りがあります。\n" + e);
                }
            }
            ReVIEW.start(function (review) {
                review.initConfig({
                    basePath: basePath,
                    read: function (path) { return Promise.resolve(files[path]); },
                    write: function (path, content) {
                        result[path] = content;
                        return Promise.resolve(null);
                    },
                    listener: {
                        onAcceptables: function (acceptableSyntaxes) {
                            logger.log(acceptableSyntaxes);
                            _this.lastAcceptableSyntaxes = acceptableSyntaxes;
                            _this.emit("syntax", acceptableSyntaxes);
                        },
                        onSymbols: function (symbols) {
                            logger.log(symbols);
                            _this.lastSymbols = symbols;
                            _this.emit("symbol", symbols);
                        },
                        onReports: function (reports) {
                            logger.log(reports);
                            _this.lastReports = reports;
                            _this.emit("report", reports);
                        },
                        onCompileSuccess: function (book) {
                            logger.log(book);
                            _this.lastBook = book;
                            _this.emit("compile-success", book);
                        },
                        onCompileFailed: function (book) {
                            logger.log();
                            _this.lastBook = null;
                            _this.emit("compile-failed", book);
                        },
                    },
                    analyzer: new SingleFileAnalyzer(),
                    validators: validators,
                    builders: [new SingleFileHTMLBuilder(false)],
                    book: {
                        contents: [
                            filename,
                        ],
                    },
                });
            });
        });
    };
    ReVIEWRunner.prototype.getContent = function () {
        return this.watcher.getContent();
    };
    ReVIEWRunner.prototype.getFilePath = function () {
        return this.watcher.getFilePath();
    };
    return ReVIEWRunner;
}(emissary_helper_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReVIEWRunner;
ReVIEWRunner.emissarified();
var EditorContentWatcher = (function (_super) {
    __extends(EditorContentWatcher, _super);
    function EditorContentWatcher(runner, editor) {
        _super.call(this);
        this.runner = runner;
        this.editor = editor;
        this.bufferSubscriptions = [];
        this.buffer = this.editor.getBuffer();
    }
    EditorContentWatcher.prototype.startWatching = function () {
        var _this = this;
        logger.log();
        if (this.grammerChangeSubscription) {
            return;
        }
        this.configureRunner();
        this.grammerChangeSubscription = this.editor.onDidChangeGrammar(function () { return _this.configureRunner(); });
    };
    EditorContentWatcher.prototype.stopWatching = function () {
        logger.log();
        if (!this.grammerChangeSubscription) {
            return;
        }
        this.grammerChangeSubscription.dispose();
        this.grammerChangeSubscription = null;
    };
    EditorContentWatcher.prototype.configureRunner = function () {
        var scopeName = this.editor.getGrammar().scopeName;
        logger.log("configureRunner grammar " + scopeName);
        if (V.reviewScopeName === scopeName) {
            this.activate();
        }
        else {
            this.deactivate();
        }
    };
    EditorContentWatcher.prototype.triggerCompile = function (withDelay) {
        var _this = this;
        if (withDelay === void 0) { withDelay = false; }
        if (this.lastKeyHitTimeoutId) {
            clearTimeout(this.lastKeyHitTimeoutId);
        }
        if (withDelay) {
            this.lastKeyHitTimeoutId = setTimeout(function () {
                _this.lastKeyHitTimeoutId = null;
                _this.runner.doCompile();
            }, EditorContentWatcher.IN_EDIT_COMPILE_TIMEOUT);
        }
        else {
            this.lastKeyHitTimeoutId = null;
            this.runner.doCompile();
        }
    };
    EditorContentWatcher.prototype.activate = function () {
        var _this = this;
        logger.log();
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.wasAlreadyActivated = true;
        this.runner.doCompile();
        if (this.bufferSubscriptions.length !== 0) {
            return;
        }
        this.bufferSubscriptions.push(this.buffer.onDidChange(function () { return _this.triggerCompile(true); }));
        this.bufferSubscriptions.push(this.buffer.onDidSave(function () { return _this.triggerCompile(); }));
        this.bufferSubscriptions.push(this.buffer.onDidReload(function () { return _this.triggerCompile(); }));
    };
    EditorContentWatcher.prototype.deactivate = function () {
        logger.log();
        this.stopWatching();
        this.bufferSubscriptions.forEach(function (subscription) { return subscription.dispose(); });
        this.bufferSubscriptions = [];
        this.runner.emit("deactivate");
    };
    EditorContentWatcher.prototype.getContent = function () {
        return this.editor.buffer.getText();
    };
    EditorContentWatcher.prototype.getFilePath = function () {
        return this.buffer.getUri();
    };
    EditorContentWatcher.IN_EDIT_COMPILE_TIMEOUT = 3000;
    return EditorContentWatcher;
}(emissary_helper_1.default));
//# sourceMappingURL=review-runner.js.map