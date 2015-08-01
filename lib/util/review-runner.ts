/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/emissary/emissary.d.ts" />
/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/text-buffer/text-buffer.d.ts" />
/// <reference path="../../typings/pathwatcher/pathwatcher.d.ts" />

/// <reference path="../../node_modules/review.js/dist/review.js.d.ts" />

// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-runner.coffee

import emissaryHelper = require("./emissary-helper");
import V = require("./const");
import logger = require("./logger");

import ReVIEW = require("review.js");
import path = require("path");

class ReVIEWRunner extends emissaryHelper.EmitterSubscriberBase {

    private watcher: IContentWatcher;

    editor: AtomCore.IEditor;
    file: PathWatcher.IFile;

    lastAcceptableSyntaxes: ReVIEW.Build.AcceptableSyntaxes;
    lastSymbols: ReVIEW.ISymbol[];
    lastReports: ReVIEW.ProcessReport[];
    lastBook: ReVIEW.Book;

    constructor(params: { editor: AtomCore.IEditor; });

    constructor(params: { file: PathWatcher.IFile; });

    constructor(params: { editor?: AtomCore.IEditor; file?: PathWatcher.IFile; }) {
        super();

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

    startWatching(): void {
        logger.log();
        this.watcher.startWatching();
    }

    stopWatching(): void {
        logger.log();
        this.watcher.stopWatching();
    }

    activate(): void {
        logger.log();
        this.watcher.activate();
    }

    deactivate(): void {
        logger.log();
        this.watcher.deactivate();
    }

    on(eventNames: "start", callback: () => any): any;

    on(eventNames: "syntax", callback: (acceptableSyntaxes: ReVIEW.Build.AcceptableSyntaxes) => any): any;

    on(eventNames: "symbol", callback: (symbols: ReVIEW.ISymbol[]) => any): any;

    on(eventNames: "report", callback: (reports: ReVIEW.ProcessReport[]) => any): any;

    on(eventNames: "compile-success", callback: (book: ReVIEW.Book) => any): any;

    on(eventNames: "compile-failed", callback: () => any): any;

    on(eventNames: string, handler: Function): any;

    // 後でReVIEWRunner.emissarified();している。特殊化されたオーバーロードのため。
    on(eventNames: string, handler: Function): any {
        throw new Error();
    }

    doCompile(): void {
        logger.log();
        this.emit("start");
        var currentPath: string = this.watcher.getFilePath() || "ch01.re";
        var basePath: string = path.isAbsolute(currentPath) ? path.dirname(currentPath) : undefined;
        var filename: string = path.basename(currentPath);

        setTimeout(() => {
            var files: { [path: string]: string; } = {};
            files[filename] = this.watcher.getContent();
            var result: { [path: string]: string; } = {
            };
            ReVIEW.start(review => {
                review.initConfig({
                    basePath: basePath,
                    read: path => Promise.resolve(files[path]),
                    write: (path, content) => {
                        result[path] = content;
                        return Promise.resolve<void>(null);
                    },
                    listener: {
                        onAcceptables: acceptableSyntaxes => {
                            logger.log(acceptableSyntaxes);
                            this.lastAcceptableSyntaxes = acceptableSyntaxes;
                            this.emit("syntax", acceptableSyntaxes);
                        },
                        onSymbols: symbols => {
                            logger.log(symbols);
                            this.lastSymbols = symbols;
                            this.emit("symbol", symbols);
                        },
                        onReports: reports => {
                            logger.log(reports);
                            this.lastReports = reports;
                            this.emit("report", reports);
                        },
                        onCompileSuccess: book => {
                            logger.log(book);
                            this.lastBook = book;
                            this.emit("compile-success", book);
                        },
                        onCompileFailed: () => {
                            logger.log();
                            this.lastBook = null;
                            this.emit("compile-failed");
                        }
                    },
                    builders: [new ReVIEW.Build.HtmlBuilder(false)],
                    book: {
                        contents: [
                            filename
                        ]
                    }
                });
            });
        });
    }

    getContent() {
        return this.watcher.getContent();
    }

    getFilePath() {
        return this.watcher.getFilePath();
    }
}

ReVIEWRunner.emissarified();

interface IContentWatcher {
    startWatching(): void;
    stopWatching(): void;
    activate(): void;
    deactivate(): void;
    getContent(): string;
    getFilePath(): string;
}

class EditorContentWatcher extends emissaryHelper.EmitterSubscriberBase implements IContentWatcher {

    buffer: TextBuffer.ITextBuffer;

    grammerChangeSubscription: AtomCore.IDisposable;
    wasAlreadyActivated: boolean;
    bufferSubscriptions: AtomCore.IDisposable[] = [];
    lastKeyHitTimeoutId: any;
    static IN_EDIT_COMPILE_TIMEOUT: number = 3000;

    constructor(public runner: ReVIEWRunner, public editor: AtomCore.IEditor) {
        super();
        this.buffer = this.editor.getBuffer();
    }

    startWatching(): void {
        logger.log();
        if (this.grammerChangeSubscription) {
            return;
        }

        this.configureRunner();

        this.grammerChangeSubscription = this.editor.onDidChangeGrammar(() => this.configureRunner());
    }

    stopWatching(): void {
        logger.log();
        if (!this.grammerChangeSubscription) {
            return;
        }

        this.grammerChangeSubscription.dispose();
        this.grammerChangeSubscription = null;
    }

    configureRunner(): void {
        var scopeName = this.editor.getGrammar().scopeName;
        logger.log("configureRunner grammar " + scopeName);
        if (V.reviewScopeName === scopeName) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    triggerCompile(withDelay: boolean = false): void {
        if (this.lastKeyHitTimeoutId) {
            clearTimeout(this.lastKeyHitTimeoutId);
        }
        if (withDelay) {
            this.lastKeyHitTimeoutId = setTimeout(() => {
                this.lastKeyHitTimeoutId = null;
                this.runner.doCompile();
            }, EditorContentWatcher.IN_EDIT_COMPILE_TIMEOUT);
        } else {
            this.lastKeyHitTimeoutId = null;
            this.runner.doCompile();
        }
    }

    activate(): void {
        logger.log();
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.wasAlreadyActivated = true;
        this.runner.doCompile();
        if (this.bufferSubscriptions.length !== 0) {
            return;
        }
        this.bufferSubscriptions.push(this.buffer.onDidChange(() => this.triggerCompile(true)));
        this.bufferSubscriptions.push(this.buffer.onDidSave(() => this.triggerCompile()));
        this.bufferSubscriptions.push(this.buffer.onDidReload(() => this.triggerCompile()));
    }

    deactivate(): void {
        logger.log();
        this.bufferSubscriptions.forEach(subscription => subscription.dispose());
        this.bufferSubscriptions = [];
        this.runner.emit("deactivate");
    }

    getContent(): string {
        return this.editor.buffer.getText();
    }

    getFilePath(): string {
        return this.buffer.getUri();
    }
}

class FileContentWatcher extends emissaryHelper.EmitterSubscriberBase implements IContentWatcher {

    fileRemovedSubscription: AtomCore.IDisposable;
    wasAlreadyActivated: boolean;
    contentChangedSubscription: AtomCore.IDisposable;

    constructor(public runner: ReVIEWRunner, public file: PathWatcher.IFile) {
        super();
    }

    startWatching(): void {
        logger.log();
        if (this.fileRemovedSubscription) {
            return;
        }

        this.configureRunner();

        this.file.onDidDelete
        this.fileRemovedSubscription = this.file.onDidDelete(() => {
            this.configureRunner();
        });
    }

    stopWatching(): void {
        logger.log();
        if (!this.fileRemovedSubscription) {
            return;
        }

        this.fileRemovedSubscription.dispose();
        this.fileRemovedSubscription = null;
    }

    configureRunner(): void {
        if (this.file.existsSync()) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    activate(): void {
        logger.log();
        if (!this.wasAlreadyActivated) {
            this.emit("activate");
        }
        this.wasAlreadyActivated = true;
        this.runner.doCompile();
        if (this.contentChangedSubscription) {
            return;
        }
        this.contentChangedSubscription = this.file.onDidDelete(() => {
            this.runner.doCompile();
        });
    }


    deactivate(): void {
        logger.log();
        if (this.contentChangedSubscription) {
            this.contentChangedSubscription.dispose();
            this.contentChangedSubscription = null;
        }
        this.runner.emit("deactivate");
    }

    getContent(): string {
        return this.file.readSync(false);
    }

    getFilePath(): string {
        return this.file.getRealPathSync();
    }
}

export = ReVIEWRunner;
