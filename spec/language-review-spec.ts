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

	describe("by default", ()=> {
		it("is enabled", () => {
			expect(editorView.find(".review-compile").length).toBe(1);
		});
	});

	describe('when enabled', () => {
		describe('and command "lint:toggle" is triggered', () => {
			beforeEach(() => {
				helper.viewToJQuery(atom.workspaceView).trigger('language-review:toggle-compile');
			});
			it('becomes disabled', () => {
				expect(editorView.find('.review-compile').length).toBe(0);
			});
		});
	});

	describe('when disabled', () => {
		describe('and command "lint:toggle" is triggered', () => {
			beforeEach(() => {
				helper.viewToJQuery(atom.workspaceView).trigger('language-review:toggle-compile');
				helper.viewToJQuery(atom.workspaceView).trigger('language-review:toggle-compile');
			});
			it('becomes enabled', () => {
				expect(editorView.find('.review-compile').length).toBe(1);
			});
		});
	});
});
