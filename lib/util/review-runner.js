/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/emissary/emissary.d.ts" />
/// <reference path="../../typings/text-buffer/text-buffer.d.ts" />
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
    function ReVIEWRunner(editor) {
        _super.call(this);
        this.editor = editor;
        this.buffer = editor.getBuffer();
    }
    ReVIEWRunner.prototype.startWatching = function () {
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

    ReVIEWRunner.prototype.stopWatching = function () {
        console.log("debug ReVIEWRunner stopWatching");
        if (!this.grammerChangeSubscription) {
            return;
        }

        this.grammerChangeSubscription.off();
        this.grammerChangeSubscription = null;
    };

    ReVIEWRunner.prototype.configureRunner = function () {
        var scopeName = this.editor.getGrammar().scopeName;
        console.log("debug ReVIEWRunner configureRunner grammar " + scopeName);
        if (V.reviewScopeName === scopeName) {
            this.activate();
        } else {
            this.deactivate();
        }
    };

    ReVIEWRunner.prototype.activate = function () {
        var _this = this;
        console.log("debug ReVIEWRunner activate");
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.doCompile();
        if (this.bufferSubscription) {
            return;
        }
        this.bufferSubscription = this.subscribe(this.buffer, "saved reloaded", function () {
            _this.doCompile();
        });
    };

    ReVIEWRunner.prototype.deactivate = function () {
        console.log("debug ReVIEWRunner deactivate");
        if (this.bufferSubscription) {
            this.bufferSubscription.off();
            this.bufferSubscription = null;
        }
        this.emit("deactivate");
    };

    // 後でReVIEWRunner.emissarified();している。特殊化されたオーバーロードのため。
    ReVIEWRunner.prototype.on = function (eventNames, handler) {
        throw new Error();
    };

    ReVIEWRunner.prototype.doCompile = function () {
        var _this = this;
        console.log("debug ReVIEWRunner doCompile");

        var files = {
            "ch01.re": this.editor.buffer.getText()
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
    };

    Object.defineProperty(ReVIEWRunner.prototype, "filePath", {
        get: function () {
            return this.buffer.getUri();
        },
        enumerable: true,
        configurable: true
    });
    return ReVIEWRunner;
})(emissaryHelper.EmitterSubscriberBase);
ReVIEWRunner.emissarified();

module.exports = ReVIEWRunner;
//# sourceMappingURL=review-runner.js.map
