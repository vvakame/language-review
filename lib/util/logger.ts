"use strict";

/* tslint:disable:ban */

function isEnableOutput():boolean {
	"use strict";

	return !!atom.config.get("language-review.debug");
}

export function log(...args:any[]):void {
	"use strict";

	if (isEnableOutput()) {
		console.log.apply(console, arguments);
	}
}

export function warn(...args:any[]):void {
	"use strict";

	if (isEnableOutput()) {
		console.warn.apply(console, arguments);
	}
}

export function error(...args:any[]):void {
	"use strict";

	if (isEnableOutput()) {
		console.error.apply(console, arguments);
	}
}

/* tslint:enable:ban */
