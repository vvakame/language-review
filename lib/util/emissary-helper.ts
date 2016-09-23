// このファイルについて
// emissary.Emitter.includeInto などでprototypeにメソッドを生やせる
// しかし、TypeScriptで同じことをやっても型的に解決できない。mixinほしい。
// そのため、インタフェースを継承し、実装を与えるが実装を削除するようにする。
// この処理を必要な箇所全てでやるとアホみたいに可読性落ちるのでこのクラスに集約する。

import * as emissary from "emissary";

export default class EmitterSubscriberBase implements Emissary.IEmitter, Emissary.ISubscriber {

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
    on(_eventNames: string, _handler: Function): any /* return value type are Signal */ {
        throw new Error();
    }

    once(_eventName: string, _handler: Function): any /* return value type are Signal */ {
        throw new Error();
    }

    signal(_eventName: string): void {
        throw new Error();
    }

    behavior(_eventName: string, _initialValue: any): void {
        throw new Error();
    }

    emit(_eventName: string, ..._args: any[]): void {
        throw new Error();
    }

    off(_eventNames: string, _handler: Function): void {
        throw new Error();
    }

    pauseEvents(_eventNames: string): void {
        throw new Error();
    }

    resumeEvents(_eventNames: string): void {
        throw new Error();
    }

    incrementSubscriptionCount(_eventName: string): number {
        throw new Error();
    }

    decrementSubscriptionCount(_eventName: string): number {
        throw new Error();
    }

    getSubscriptionCount(_eventName: string): number {
        throw new Error();
    }

    hasSubscriptions(_eventName: string): boolean {
        throw new Error();
    }

    // overwrite by emissary.Subscriber.includeInto(ReVIEWRunner);
    subscribeWith(_eventEmitter: any, _methodName: string, _args: any): Emissary.ISubscription {
        throw new Error();
    }

    addSubscription(_subscription: any): Emissary.ISubscription {
        throw new Error();
    }

    subscribe(_eventEmitterOrSubscription: any, ..._args: any[]): Emissary.ISubscription {
        throw new Error();
    }

    subscribeToCommand(_eventEmitter: any, ..._args: any[]): Emissary.ISubscription {
        throw new Error();
    }

    unsubscribe(_object?: any): any {
        throw new Error();
    }
}

EmitterSubscriberBase.emissarified();
