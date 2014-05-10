/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />

import _atom = require("atom");

/* tslint:disable */
var vm = require("vm");
var fs = require("fs");

var fileName = __dirname + "/../bower-task/main-js/bootstrap/tooltip.js";
var code = fs.readFileSync(fileName, {encoding: "utf-8"});
/* tslint:enable */

var sandbox:any = {
	jQuery: _atom.$,
	setTimeout: window.setTimeout.bind(window),
	clearTimeout: window.clearTimeout.bind(window)
};
vm.runInNewContext(code, sandbox, "tooltip.js");

export var jQuery:JQueryStatic = sandbox.jQuery;
export var $:JQueryStatic = sandbox.jQuery;

export interface IViolationTooltipOptions {
	animation?:boolean;
	placement?: string;
	selector?:any;
	template?:string;
	trigger?:string;
	title?:string;
	delay?:any; // number or {show: number; hide: number; }
	html?:boolean;
	container?:any;
}

// TypeScriptコンパイラの制約回避
vm.runInNewContext("Tooltip = $.fn.tooltip.Constructor;", module.exports, "adhoc.vm");
export declare class Tooltip {
	static DEFAULTS:IViolationTooltipOptions;

	type:string;
	options:any;
	enabled:boolean;
	timeout:any;
	hoverState:any;
	element:any;
	$element:JQuery;

	constructor(element:JQuery, options:IViolationTooltipOptions);

	constructor(element:HTMLElement, options:IViolationTooltipOptions);

	getDefaults():IViolationTooltipOptions;

	getOptions(options:IViolationTooltipOptions):IViolationTooltipOptions;

	getDelegateOptions():any;

	enter(obj:any):any;

	leave(obj:any):any;

	show():void;

	applyPlacement(offset:any, placement:any):any;

	replaceArrow(delta:any, dimension:any, position:any):any;

	hide():Tooltip;

	fixTitle():void;

	hasContent():any;

	getPosition():any;

	getCalculatedOffset(placement:any, pos:any, actualWidth:any, actualHeight:any):any;

	getTitle():any;

	tip():any;

	arrow():any;

	validate():void;

	enable():void;

	disable():void;

	toggleEnabled():void;

	toggle(e:any):any;

	destroy():void;
}
