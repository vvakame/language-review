"use strict";

/* tslint:disable:ban */

function isEnableOutput():boolean {
	"use strict";

	return !!atom.config.get("language-review.debug");
}

interface ICallSite {
	getThis():any;
	getTypeName():string;
	getFunction():Function;
	getFunctionName():string;
	getMethodName():string;
	getFileName():string;
	getLineNumber():number;
	getColumnNumber():number;
	getEvalOrigin():any;
	isToplevel():boolean;
	isEval():boolean;
	isNative():boolean;
	isConstructor():boolean;
}

function getCallSites(strip = 2):ICallSite[] {
	"use strict";

	function MyError() {
		(<any>Error).captureStackTrace(this, MyError);
	}

	var oldPrepareStackTrace = (<any>Error).prepareStackTrace;

	var callSites:any[];

	(<any>Error).prepareStackTrace = function (error:any, stack:any) {
		callSites = stack;
		return stack;
	};
	var obj:any = new (<any>MyError)();

	obj.stack;

	(<any>Error).prepareStackTrace = oldPrepareStackTrace;

	for (var i = 0; i < strip; i++) {
		callSites.shift();
	}

	return callSites;
}

function logHelper(callback:()=>void):void {
	"use strict";

	var callSite = getCallSites(3)[0];
	var label:string;
	var functionName = callSite.getFunctionName();
	if (functionName) {
		label = functionName;
	} else {
		var fileName = callSite.getFileName();
		label = fileName.substr(fileName.lastIndexOf("/") + 1);
		label += ":" + callSite.getLineNumber() + ":" + callSite.getColumnNumber();
	}

	console.group(label);
	console.log([callSite.getFileName(), callSite.getLineNumber(), callSite.getColumnNumber()]);
	callback();
	console.groupEnd();
}

/* tslint:disable:no-unused-variable */

export function log(...args:any[]):void {
	"use strict";

	if (isEnableOutput()) {
		logHelper(()=> {
			console.log.apply(console, args);
		});
	}
}

export function warn(...args:any[]):void {
	"use strict";

	if (isEnableOutput()) {
		logHelper(()=> {
			console.warn.apply(console, args);
		});
	}
}

export function error(...args:any[]):void {
	"use strict";

	if (isEnableOutput()) {
		logHelper(()=> {
			console.error.apply(console, args);
		});
	}
}

/* tslint:enable:ban no-unused-variable */
