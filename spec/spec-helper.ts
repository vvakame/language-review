import _atom = require("atom");
var WorkspaceView = _atom.WorkspaceView;

import fs = require("fs");
import path = require("path");

var temp: any = require("temp");

declare function waitsForPromise(callback: Function): void;

export function viewToJQuery(view: any): JQuery {
    return <any>view;
}

export function prepareWorkspace(options: { filename?: string; activatePackage?: boolean; } = {}) {
    var projectPath = temp.mkdirSync("language-review-spec-");
    atom.project.setPath(projectPath);

    var filename = options.filename || "sample.txt";
    var filePath = path.join(projectPath, filename);
    fs.writeFileSync(filePath, "This is a sample file.");

    atom.workspaceView = new WorkspaceView();
    (<any>atom).workspaceView.attachToDom();
    atom.workspaceView.openSync(filename);

    if (options.activatePackage) {
        waitsForPromise(() => {
            return atom.packages.activatePackage("language-review");
        });
    }

    return {
        editorView: atom.workspaceView.getActiveView()
    };
}
