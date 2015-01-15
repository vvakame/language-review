/// <reference path="../../typings/emissary/emissary.d.ts" />
// このファイルについて
// emissary.Emitter.includeInto などでprototypeにメソッドを生やせる
// しかし、TypeScriptで同じことをやっても型的に解決できない。mixinほしい。
// そのため、インタフェースを継承し、実装を与えるが実装を削除するようにする。
// この処理を必要な箇所全てでやるとアホみたいに可読性落ちるのでこのクラスに集約する。
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
    EmitterSubscriberBase.prototype.on = function (eventNames, handler) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.once = function (eventName, handler) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.signal = function (eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.behavior = function (eventName, initialValue) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.emit = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        throw new Error();
    };
    EmitterSubscriberBase.prototype.off = function (eventNames, handler) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.pauseEvents = function (eventNames) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.resumeEvents = function (eventNames) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.incrementSubscriptionCount = function (eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.decrementSubscriptionCount = function (eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.getSubscriptionCount = function (eventName) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.hasSubscriptions = function (eventName) {
        throw new Error();
    };
    // overwrite by emissary.Subscriber.includeInto(ReVIEWRunner);
    EmitterSubscriberBase.prototype.subscribeWith = function (eventEmitter, methodName, args) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.addSubscription = function (subscription) {
        throw new Error();
    };
    EmitterSubscriberBase.prototype.subscribe = function (eventEmitterOrSubscription) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        throw new Error();
    };
    EmitterSubscriberBase.prototype.subscribeToCommand = function (eventEmitter) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        throw new Error();
    };
    EmitterSubscriberBase.prototype.unsubscribe = function (object) {
        throw new Error();
    };
    return EmitterSubscriberBase;
})();
exports.EmitterSubscriberBase = EmitterSubscriberBase;
EmitterSubscriberBase.emissarified();
//# sourceMappingURL=emissary-helper.js.map