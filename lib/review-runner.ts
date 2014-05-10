/// <reference path="../typings/atom/atom.d.ts" />
/// <reference path="../typings/emissary/emissary.d.ts" />
/// <reference path="../typings/text-buffer/text-buffer.d.ts" />

import emissaryHelper = require("./emissary-helper");
import V = require("./const");

class ReVIEWRunner extends emissaryHelper.EmitterSubscriberBase {

	buffer:TextBuffer.ITextBuffer;
	grammerChangeSubscription:Emissary.ISubscription;
	wasAlreadyActivated:boolean;
	bufferSubscription:Emissary.ISubscription;

	constructor(public editor:AtomCore.IEditor) {
		super();
		this.buffer = editor.getBuffer();
	}

	startWatching() {
		console.log("debug ReVIEWRunner startWatching");
		if (this.grammerChangeSubscription) {
			return;
		}

		this.configureRunner();

		this.grammerChangeSubscription = this.subscribe(this.editor, "grammar-changed", ()=> {
			this.configureRunner();
		});
	}

	stopWatching() {
		console.log("debug ReVIEWRunner stopWatching");
		if (!this.grammerChangeSubscription) {
			return;
		}

		this.grammerChangeSubscription.off();
		this.grammerChangeSubscription = null;
	}

	configureRunner() {
		var scopeName = this.editor.getGrammar().scopeName;
		console.log("debug ReVIEWRunner configureRunner grammar " + scopeName);
		if (V.reviewScopeName === scopeName) {
			this.activate();
		} else {
			this.deactivate();
		}
	}

	activate() {
		console.log("debug ReVIEWRunner activate");
		if (!this.wasAlreadyActivated) {
			this.emit("activate");
		}
		this.doCompile();
		if (this.bufferSubscription) {
			return;
		}
		this.bufferSubscription = this.subscribe(this.buffer, "saved reloaded", ()=> {
			this.doCompile();
		});
	}

	deactivate() {
		console.log("debug ReVIEWRunner deactivate");
		if (this.bufferSubscription) {
			this.bufferSubscription.off();
			this.bufferSubscription = null;
		}
		this.emit("deactivate");
	}

	doCompile() {
		console.log("debug ReVIEWRunner doCompile");


		this.emit("compile", {}, []);
	}

	getFilePath() {
		return this.buffer.getUri();
	}
}

export = ReVIEWRunner;
