/* tslint:disable:ban */

function isEnableOutput(): boolean {
    return !!atom.config.get("language-review.debug");
}

interface CallSite {
    getThis(): any;
    getTypeName(): string;
    getFunction(): Function;
    getFunctionName(): string;
    getMethodName(): string;
    getFileName(): string;
    getLineNumber(): number;
    getColumnNumber(): number;
    getEvalOrigin(): any;
    isToplevel(): boolean;
    isEval(): boolean;
    isNative(): boolean;
    isConstructor(): boolean;
}

function getCallSites(strip = 2): CallSite[] {
    class MyError extends Error {
        constructor() {
            super();
            (Error as any).captureStackTrace(this, MyError);
        }
    }

    let oldPrepareStackTrace = (Error as any).prepareStackTrace;
    let callSites: any[];
    (Error as any).prepareStackTrace = (_error: any, stack: any) => {
        callSites = stack;
        return stack;
    };
    new MyError().stack;
    (Error as any).prepareStackTrace = oldPrepareStackTrace;

    if (!callSites) {
        // NOTE https://github.com/atom/atom/pull/9181
        // Error.prepareStackTrace が上書きできない
        return null;
    }

    for (let i = 0; i < strip; i++) {
        callSites.shift();
    }

    return callSites;
}

function logHelper(callback: () => void): void {
    let callSites = getCallSites(3);
    if (callSites) {
        let callSite = callSites[0];
        let label: string;
        let functionName = callSite.getFunctionName();
        if (functionName) {
            label = functionName;
        } else {
            let fileName = callSite.getFileName();
            label = `${fileName.substr(fileName.lastIndexOf("/") + 1)}:${callSite.getLineNumber()}:${callSite.getColumnNumber()}`;
        }
        console.group(label);
        console.log([callSite.getFileName(), callSite.getLineNumber(), callSite.getColumnNumber()]);
        callback();
        console.groupEnd();
    } else {
        callback();
    }
}

/* tslint:disable:no-unused-variable */

export function log(...args: any[]): void {
    if (isEnableOutput()) {
        logHelper(() => {
            console.log.apply(console, args);
        });
    }
}

export function warn(...args: any[]): void {
    if (isEnableOutput()) {
        logHelper(() => {
            console.warn.apply(console, args);
        });
    }
}

export function error(...args: any[]): void {
    if (isEnableOutput()) {
        logHelper(() => {
            console.error.apply(console, args);
        });
    }
}

/* tslint:enable:ban no-unused-variable */
