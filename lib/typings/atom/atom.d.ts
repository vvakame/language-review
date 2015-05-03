declare module AtomCore {
    interface IAtom {
        notifications: INotifications;
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
}
