/// <reference path="../node_modules/typescript/bin/lib.es6.d.ts" />

/// <reference path="../typings/jasmine/jasmine.d.ts" />

/// <reference path="../typings/jquery/jquery.d.ts" />

require('source-map-support').install();

import helper = require("./spec-helper");

describe("language-review", ()=> {
	var editorView:JQuery;

	beforeEach(()=> {
		var result = helper.prepareWorkspace({ activatePackage: true });
		editorView = <any>result.editorView;
	});
});
