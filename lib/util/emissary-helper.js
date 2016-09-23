// このファイルについて
// emissary.Emitter.includeInto などでprototypeにメソッドを生やせる
// しかし、TypeScriptで同じことをやっても型的に解決できない。mixinほしい。
// そのため、インタフェースを継承し、実装を与えるが実装を削除するようにする。
// この処理を必要な箇所全てでやるとアホみたいに可読性落ちるのでこのクラスに集約する。
"use strict";
var emissary = require("emissary");
var EmitterSubscriberBase = (function () {
    function EmitterSubscriberBase() {
    }
    EmitterSubscriberBase.emissarified = function () {
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
    };
    // overwrite by emissary.Emitter.includeInto(ReVIEWRunner);
    EmitterSubscriberBase.prototype.on = function (_eventNames, _handler) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.once = function (_eventName, _handler) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.signal = function (_eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.behavior = function (_eventName, _initialValue) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.emit = function (_eventName) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        throw new Error();
    };
    EmitterSubscriberBase.prototype.off = function (_eventNames, _handler) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.pauseEvents = function (_eventNames) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.resumeEvents = function (_eventNames) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.incrementSubscriptionCount = function (_eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.decrementSubscriptionCount = function (_eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.getSubscriptionCount = function (_eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.hasSubscriptions = function (_eventName) {
        throw new Error();
    };
    // overwrite by emissary.Subscriber.includeInto(ReVIEWRunner);
    EmitterSubscriberBase.prototype.subscribeWith = function (_eventEmitter, _methodName, _args) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.addSubscription = function (_subscription) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.subscribe = function (_eventEmitterOrSubscription) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        throw new Error();
    };
    EmitterSubscriberBase.prototype.subscribeToCommand = function (_eventEmitter) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        throw new Error();
    };
    EmitterSubscriberBase.prototype.unsubscribe = function (_object) {
        throw new Error();
    };
    return EmitterSubscriberBase;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EmitterSubscriberBase;
EmitterSubscriberBase.emissarified();
//# sourceMappingURL=emissary-helper.js.map