/// <reference path="../../typings/emissary/emissary.d.ts" />

// このファイルについて
// emissary.Emitter.includeInto などでprototypeにメソッドを生やせる
// しかし、TypeScriptで同じことをやっても型的に解決できない。mixinほしい。
// そのため、インタフェースを継承し、実装を与えるが実装を削除するようにする。
// この処理を必要な箇所全てでやるとアホみたいに可読性落ちるのでこのクラスに集約する。

import emissary = require("emissary");

export class EmitterSubscriberBase implements Emissary.IEmitter, Emissary.ISubscriber {

	static emissarified() {
		delete this.prototype.on;
		delete this.prototype.once;
		delete this.prototype.signal;
		delete this.prototype.behavior;
		delete this.prototype.emit;
		delete this.prototype.off;
		delete this.prototype.pauseEvents;
		delete this.prototype.resumeEvents;
		delete this.prototype.incrementSubscriptionCount;
		delete this.prototype.decrementSubscriptionCount;
		delete this.prototype.getSubscriptionCount;
		delete this.prototype.hasSubscriptions;
		delete this.prototype.subscribeWith;
		delete this.prototype.addSubscription;
		delete this.prototype.subscribe;
		delete this.prototype.subscribeToCommand;
		delete this.prototype.unsubscribe;
		emissary.Emitter.includeInto(this);
		emissary.Subscriber.includeInto(this);
	}

	// overwrite by emissary.Emitter.includeInto(ReVIEWRunner);
	on(eventNames:string, handler:Function):any // return value type are Signal
	{
		throw new Error();
	}

	once(eventName:string, handler:Function):any // return value type are Signal
	{
		throw new Error();
	}

	signal(eventName:string):void {
		throw new Error();
	}

	behavior(eventName:string, initialValue:any):void {
		throw new Error();
	}

	emit(eventName:string, ...args:any[]):void {
		throw new Error();
	}

	off(eventNames:string, handler:Function):void {
		throw new Error();
	}

	pauseEvents(eventNames:string):void {
		throw new Error();
	}

	resumeEvents(eventNames:string):void {
		throw new Error();
	}

	incrementSubscriptionCount(eventName:string):number {
		throw new Error();
	}

	decrementSubscriptionCount(eventName:string):number {
		throw new Error();
	}

	getSubscriptionCount(eventName:string):number {
		throw new Error();
	}

	hasSubscriptions(eventName:string):boolean {
		throw new Error();
	}

	// overwrite by emissary.Subscriber.includeInto(ReVIEWRunner);
	subscribeWith(eventEmitter:any, methodName:string, args:any):Emissary.ISubscription {
		throw new Error();
	}

	addSubscription(subscription:any):Emissary.ISubscription {
		throw new Error();
	}

	subscribe(eventEmitterOrSubscription:any, ...args:any[]):Emissary.ISubscription {
		throw new Error();
	}

	subscribeToCommand(eventEmitter:any, ...args:any[]):Emissary.ISubscription {
		throw new Error();
	}

	unsubscribe(object?:any):any {
		throw new Error();
	}
}

EmitterSubscriberBase.emissarified();
