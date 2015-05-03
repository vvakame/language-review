declare module AtomCore {
    interface IAtom {
        notifications: INotifications;
        views: IViews;
    }
    interface IWorkspace {
        addOpener(callback: (url: string, options?: any) => any): IDisposable;
        getActiveTextEditor(): IEditor;
        getTextEditors(): IEditor[];
        paneForURI: (uri: string) => IPane;
    }
    interface IPackageManager {
        onDidActivateInitialPackages(callback: () => void): IDisposable;
    }
    interface INotifications {
        addInfo(message: string, options?: { detail?: any; dismissable?: boolean; icon?: string; }): INotification;
        addError(message: string, options?: { detail?: any; dismissable?: boolean; icon?: string; }): INotification;
        addFatalError(message: string, options?: { detail?: any; dismissable?: boolean; icon?: string; }): INotification;
        addSuccess(message: string, options?: { detail?: any; dismissable?: boolean; icon?: string; }): INotification;
        addWarning(message: string, options?: { detail?: any; dismissable?: boolean; icon?: string; }): INotification;
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
}

declare module TextBuffer {
    interface ITextBuffer {
        onDidChange(callback: () => void): AtomCore.IDisposable;
    }
}

declare module PathWatcher {
    interface IFile {
        onDidChange(callback: () => void): AtomCore.IDisposable;
        onDidRename(callback: () => void): AtomCore.IDisposable;
        onDidDelete(callback: () => void): AtomCore.IDisposable;
    }
}
