/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/emissary/emissary.d.ts" />
/// <reference path="../../typings/text-buffer/text-buffer.d.ts" />
/// <reference path="../../typings/pathwatcher/pathwatcher.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />
// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-runner.coffee
var emissaryHelper = require("./emissary-helper");
var V = require("./const");
var logger = require("./logger");
var ReVIEW = require("review.js");
var ReVIEWRunner = (function (_super) {
    __extends(ReVIEWRunner, _super);
    function ReVIEWRunner(params) {
        _super.call(this);
        this.editor = params.editor;
        this.file = params.file;
        if (this.editor) {
            this.watcher = new EditorContentWatcher(this, this.editor);
        }
        else if (this.file) {
            this.watcher = new FileContentWatcher(this, this.file);
        }
        else {
            throw new Error("editor or file are required");
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
    ReVIEWRunner.prototype.on = function (eventNames, handler) {
        throw new Error();
    };
    ReVIEWRunner.prototype.doCompile = function () {
        var _this = this;
        logger.log();
        this.emit("start");
        setTimeout(function () {
            var files = {
                "ch01.re": _this.watcher.getContent()
            };
            var result = {};
            ReVIEW.start(function (review) {
                review.initConfig({
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
                        onCompileFailed: function () {
                            logger.log();
                            _this.lastBook = null;
                            _this.emit("compile-failed");
                        }
                    },
                    builders: [new ReVIEW.Build.HtmlBuilder(false)],
                    book: {
                        contents: [
                            "ch01.re"
                        ]
                    }
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
})(emissaryHelper.EmitterSubscriberBase);
ReVIEWRunner.emissarified();
var EditorContentWatcher = (function (_super) {
    __extends(EditorContentWatcher, _super);
    function EditorContentWatcher(runner, editor) {
        _super.call(this);
        this.runner = runner;
        this.editor = editor;
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
    EditorContentWatcher.prototype.activate = function () {
        var _this = this;
        logger.log();
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.wasAlreadyActivated = true;
        this.runner.doCompile();
        if (this.bufferSubscriptions !== undefined && Object.keys(this.bufferSubscriptions).length !== 0) {
            return;
        }
        this.bufferSubscriptions = this.bufferSubscriptions || [];
        this.bufferSubscriptions.push(this.buffer.onDidChange(function () {
            _this.lastKeyHitAt = +new Date();
            new Promise(function (resolve, reject) {
                setTimeout(resolve, EditorContentWatcher.IN_EDIT_COMPILE_TIMEOUT);
            }).then(function () {
                if (EditorContentWatcher.IN_EDIT_COMPILE_TIMEOUT < (+new Date()) - _this.lastKeyHitAt) {
                    _this.runner.doCompile();
                }
            });
        }));
        this.bufferSubscriptions.push(this.buffer.onDidSave(function () { return _this.runner.doCompile(); }));
        this.bufferSubscriptions.push(this.buffer.onDidReload(function () { return _this.runner.doCompile(); }));
    };
    EditorContentWatcher.prototype.deactivate = function () {
        logger.log();
        if (Object.keys(this.bufferSubscriptions).length !== 0) {
            this.bufferSubscriptions.forEach(function (subscription) { return subscription.dispose(); });
            this.bufferSubscriptions.length = 0;
        }
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
})(emissaryHelper.EmitterSubscriberBase);
var FileContentWatcher = (function (_super) {
    __extends(FileContentWatcher, _super);
    function FileContentWatcher(runner, file) {
        _super.call(this);
        this.runner = runner;
        this.file = file;
    }
    FileContentWatcher.prototype.startWatching = function () {
        var _this = this;
        logger.log();
        if (this.fileRemovedSubscription) {
            return;
        }
        this.configureRunner();
        this.file.onDidDelete;
        this.fileRemovedSubscription = this.file.onDidDelete(function () {
            _this.configureRunner();
        });
    };
    FileContentWatcher.prototype.stopWatching = function () {
        logger.log();
        if (!this.fileRemovedSubscription) {
            return;
        }
        this.fileRemovedSubscription.dispose();
        this.fileRemovedSubscription = null;
    };
    FileContentWatcher.prototype.configureRunner = function () {
        if (this.file.existsSync()) {
            this.activate();
        }
        else {
            this.deactivate();
        }
    };
    FileContentWatcher.prototype.activate = function () {
        var _this = this;
        logger.log();
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.wasAlreadyActivated = true;
        this.runner.doCompile();
        if (this.contentChangedSubscription) {
            return;
        }
        this.contentChangedSubscription = this.file.onDidDelete(function () {
            _this.runner.doCompile();
        });
    };
    FileContentWatcher.prototype.deactivate = function () {
        logger.log();
        if (this.contentChangedSubscription) {
            this.contentChangedSubscription.dispose();
            this.contentChangedSubscription = null;
        }
        this.runner.emit("deactivate");
    };
    FileContentWatcher.prototype.getContent = function () {
        return this.file.readSync(false);
    };
    FileContentWatcher.prototype.getFilePath = function () {
        return this.file.getRealPathSync();
    };
    return FileContentWatcher;
})(emissaryHelper.EmitterSubscriberBase);
module.exports = ReVIEWRunner;
//# sourceMappingURL=review-runner.js.map