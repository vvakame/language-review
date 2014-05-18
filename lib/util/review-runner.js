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

var ReVIEW = require("review.js");

var ReVIEWRunner = (function (_super) {
    __extends(ReVIEWRunner, _super);
    function ReVIEWRunner(params, options) {
        if (typeof options === "undefined") { options = {}; }
        _super.call(this);
        this.options = options;

        this.editor = params.editor;
        this.file = params.file;

        if (this.editor) {
            this.watcher = new EditorContentWatcher(this, this.editor);
        } else if (this.file) {
            this.watcher = new FileContentWatcher(this, this.file);
        } else {
            throw new Error("editor or file are required");
        }
    }
    ReVIEWRunner.prototype.startWatching = function () {
        console.log("debug ReVIEWRunner startWatching");
        this.watcher.startWatching();
    };

    ReVIEWRunner.prototype.stopWatching = function () {
        console.log("debug ReVIEWRunner stopWatching");
        this.watcher.stopWatching();
    };

    ReVIEWRunner.prototype.activate = function () {
        console.log("debug ReVIEWRunner activate");
        this.watcher.activate();
    };

    ReVIEWRunner.prototype.deactivate = function () {
        console.log("debug ReVIEWRunner deactivate");
        this.watcher.deactivate();
    };

    // 後でReVIEWRunner.emissarified();している。特殊化されたオーバーロードのため。
    ReVIEWRunner.prototype.on = function (eventNames, handler) {
        throw new Error();
    };

    ReVIEWRunner.prototype.doCompile = function () {
        var _this = this;
        console.log("debug ReVIEWRunner doCompile");
        this.emit("start");

        setTimeout(function () {
            var files = {
                "ch01.re": _this.watcher.getContent()
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
                        onAcceptables: function (acceptableSyntaxes) {
                            console.log("onAcceptables", acceptableSyntaxes);
                            _this.lastAcceptableSyntaxes = acceptableSyntaxes;
                            _this.emit("syntax", acceptableSyntaxes);
                        },
                        onSymbols: function (symbols) {
                            console.log("onSymbols", symbols);
                            _this.lastSymbols = symbols;
                            _this.emit("symbol", symbols);
                        },
                        onReports: function (reports) {
                            console.log("onReports", reports);
                            _this.lastReports = reports;
                            _this.emit("report", reports);
                        },
                        onCompileSuccess: function (book) {
                            console.log("onCompileSuccess", book);
                            _this.lastBook = book;
                            _this.emit("compile-success", book);
                        },
                        onCompileFailed: function () {
                            console.log("onCompileFailed");
                            _this.lastBook = null;
                            _this.emit("compile-failed");
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
        console.log("debug ReVIEWRunner startWatching");
        if (this.grammerChangeSubscription) {
            return;
        }

        this.configureRunner();

        this.grammerChangeSubscription = this.subscribe(this.editor, "grammar-changed", function () {
            _this.configureRunner();
        });
    };

    EditorContentWatcher.prototype.stopWatching = function () {
        console.log("debug ReVIEWRunner stopWatching");
        if (!this.grammerChangeSubscription) {
            return;
        }

        this.grammerChangeSubscription.off();
        this.grammerChangeSubscription = null;
    };

    EditorContentWatcher.prototype.configureRunner = function () {
        var scopeName = this.editor.getGrammar().scopeName;
        console.log("debug ReVIEWRunner configureRunner grammar " + scopeName);
        if (V.reviewScopeName === scopeName) {
            this.activate();
        } else {
            this.deactivate();
        }
    };

    EditorContentWatcher.prototype.activate = function () {
        var _this = this;
        console.log("debug ReVIEWRunner activate");
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.wasAlreadyActivated = true;
        this.runner.doCompile();
        if (this.bufferSubscription) {
            return;
        }
        var subscribeEvents = "saved reloaded";
        if (this.runner.options.highFrequency) {
            subscribeEvents += " contents-modified";
        }
        this.bufferSubscription = this.subscribe(this.buffer, subscribeEvents, function () {
            _this.runner.doCompile();
        });
    };

    EditorContentWatcher.prototype.deactivate = function () {
        console.log("debug ReVIEWRunner deactivate");
        if (this.bufferSubscription) {
            this.bufferSubscription.off();
            this.bufferSubscription = null;
        }
        this.runner.emit("deactivate");
    };

    EditorContentWatcher.prototype.getContent = function () {
        return this.editor.buffer.getText();
    };

    EditorContentWatcher.prototype.getFilePath = function () {
        return this.buffer.getUri();
    };
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
        console.log("debug ReVIEWRunner startWatching");
        if (this.fileRemovedSubscription) {
            return;
        }

        this.configureRunner();

        this.fileRemovedSubscription = this.subscribe(this.file, "removed", function () {
            _this.configureRunner();
        });
    };

    FileContentWatcher.prototype.stopWatching = function () {
        console.log("debug ReVIEWRunner stopWatching");
        if (!this.fileRemovedSubscription) {
            return;
        }

        this.fileRemovedSubscription.off();
        this.fileRemovedSubscription = null;
    };

    FileContentWatcher.prototype.configureRunner = function () {
        if (this.file.exists()) {
            this.activate();
        } else {
            this.deactivate();
        }
    };

    FileContentWatcher.prototype.activate = function () {
        var _this = this;
        console.log("debug ReVIEWRunner activate");
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.wasAlreadyActivated = true;
        this.runner.doCompile();
        if (this.contentChangedSubscription) {
            return;
        }
        this.contentChangedSubscription = this.subscribe(this.file, "contents-changed", function () {
            _this.runner.doCompile();
        });
    };

    FileContentWatcher.prototype.deactivate = function () {
        console.log("debug ReVIEWRunner deactivate");
        if (this.contentChangedSubscription) {
            this.contentChangedSubscription.off();
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
