// check this https://github.com/yujinakayama/atom-lint/blob/master/lib/lint-runner.coffee

import EmitterSubscriberBase from "./emissary-helper";
import * as V from "./const";
import * as logger from "./logger";

import * as ReVIEW from "review.js";
import * as path from "path";
import * as fs from "fs";

import * as PrhValidator from "reviewjs-prh";

// 別の.reを参照する構文を生かしておくとビルドエラーになるので潰しておく。
class SingleFileAnalyzer extends ReVIEW.DefaultAnalyzer {
    inline_chap(builder: /* AcceptableSyntaxBuilder */ any) {
        this.inlineDecorationSyntax(builder, "chap");
    }

    inline_title(builder: /* AcceptableSyntaxBuilder */ any) {
        this.inlineDecorationSyntax(builder, "title");
    }

    inline_chapref(builder: /* AcceptableSyntaxBuilder */ any) {
        this.inlineDecorationSyntax(builder, "chapref");
    }
}

// 別の.reを参照する構文を生かしておくとビルドエラーになるので潰しておく。
class SingleFileHTMLBuilder extends ReVIEW.HtmlBuilder {
    inline_chap(process: /* BuilderProcess */ any, _node: /* InlineElementSyntaxTree */ any) {
        process.out("第X章");
        return false;
    }

    inline_title(process: /* BuilderProcess */ any, _node: /* InlineElementSyntaxTree */ any) {
        process.out("章タイトル(仮)");
        return false;
    }

    inline_chapref(process: /* BuilderProcess */ any, _node: /* InlineElementSyntaxTree */ any) {
        process.out("第X章「章タイトル(仮)」");
        return false;
    }
}

export default class ReVIEWRunner extends EmitterSubscriberBase {

    private watcher: ContentWatcher;

    editor: AtomCore.IEditor;

    lastAcceptableSyntaxes: ReVIEW.AcceptableSyntaxes;
    lastSymbols: ReVIEW.Symbol[];
    lastReports: ReVIEW.ProcessReport[];
    lastBook: ReVIEW.Book;

    constructor(params: { editor: AtomCore.IEditor; }) {
        super();

        this.editor = params.editor;

        if (this.editor) {
            this.watcher = new EditorContentWatcher(this, this.editor);
        } else {
            throw new Error("editor is required");
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
    on(eventNames: "syntax", callback: (acceptableSyntaxes: ReVIEW.AcceptableSyntaxes) => any): any;
    on(eventNames: "symbol", callback: (symbols: ReVIEW.Symbol[]) => any): any;
    on(eventNames: "report", callback: (reports: ReVIEW.ProcessReport[]) => any): any;
    on(eventNames: "compile-success", callback: (book: ReVIEW.Book) => any): any;
    on(eventNames: "compile-failed", callback: (book: ReVIEW.Book) => any): any;
    on(eventNames: string, handler: Function): any;

    // 後でReVIEWRunner.emissarified();している。特殊化されたオーバーロードのため。
    on(_eventNames: string, _handler: Function): any {
        throw new Error();
    }

    doCompile(): void {
        logger.log();
        this.emit("start");
        let currentPath: string = this.watcher.getFilePath() || "ch01.re";
        let basePath: string = path.isAbsolute(currentPath) ? path.dirname(currentPath) : undefined;
        let filename: string = path.basename(currentPath);

        setTimeout(() => {
            let files: { [path: string]: string; } = {};
            files[filename] = this.watcher.getContent();
            let result: { [path: string]: string; } = {
            };
            let validators: ReVIEW.Validator[] = [
                new ReVIEW.DefaultValidator(),
            ];
            let dirName: string;
            if (this.editor) {
                dirName = this.editor.getBuffer().file.getParent().getPath();
            }
            let prhFilePath = path.join(dirName, "prh.yml");
            if (fs.existsSync(prhFilePath)) {
                try {
                    validators.push(new PrhValidator.TextValidator(prhFilePath));
                } catch (e) {
                    atom.notifications.addWarning("prh.ymlの定義に誤りがあります。\n" + e);
                }
            }

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
                        onCompileFailed: book => {
                            logger.log();
                            this.lastBook = null;
                            this.emit("compile-failed", book);
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
    }

    getContent() {
        return this.watcher.getContent();
    }

    getFilePath() {
        return this.watcher.getFilePath();
    }
}

ReVIEWRunner.emissarified();

interface ContentWatcher {
    startWatching(): void;
    stopWatching(): void;
    activate(): void;
    deactivate(): void;
    getContent(): string;
    getFilePath(): string;
}

class EditorContentWatcher extends EmitterSubscriberBase implements ContentWatcher {

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
        let scopeName = this.editor.getGrammar().scopeName;
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
        this.stopWatching();
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
