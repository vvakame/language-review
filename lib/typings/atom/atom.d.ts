declare module AtomCore {
    interface IWorkspace {
        addOpener(callback: (url: string, options?: any) => any): IDisposable;
        getActiveTextEditor(): IEditor;
        getTextEditors(): IEditor[];
    }
    interface IPackageManager {
        onDidActivateInitialPackages(callback: () => void): IDisposable;
    }
    interface INotifications {
        addFatalError(message: string, options?: { detail?: any; dismissable?: boolean; icon?: string; }): INotification;
    }
    interface INotification {
        dismiss(): void;
        // TBD
    }
    interface IViews {
        getView(src: any): HTMLElement;
    }
    interface IDisposable {
        dispose(): void;
    }
    interface IEditor {
        onDidChangeGrammar(callback: () => void): AtomCore.IDisposable;
    }
    interface IConfig {
        observe(key: string, callback: (newValue: any) => void): IDisposable;
        observe(key: string, options: any, callback: (newValue: any) => void): IDisposable;
    }
}

declare module TextBuffer {
    interface ITextBuffer {
        onDidChange(callback: () => void): AtomCore.IDisposable;
        onDidReload(callback: () => void): AtomCore.IDisposable;
        onDidSave(callback: () => void): AtomCore.IDisposable;
    }
}

declare module PathWatcher {
    interface IFile {
        onDidChange(callback: () => void): AtomCore.IDisposable;
        onDidRename(callback: () => void): AtomCore.IDisposable;
        onDidDelete(callback: () => void): AtomCore.IDisposable;
    }
}
