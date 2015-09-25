require('source-map-support').install();

import helper = require("./spec-helper");

describe("language-review", () => {
    var editorView: JQuery;

    beforeEach(() => {
        var result = helper.prepareWorkspace({ activatePackage: true });
        editorView = <any>result.editorView;
    });
});
