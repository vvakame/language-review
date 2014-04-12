/// <reference path="./space-pen.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var SpacePen = require("space-pen");
var View = SpacePen.View;

var Spacecraft = (function (_super) {
    __extends(Spacecraft, _super);
    function Spacecraft() {
        _super.call(this);
    }
    Spacecraft.content = function () {
        var _this = this;
        this.div(function () {
            _this.h1("Spacecraft");
            _this.ol(function () {
                _this.li("Apollo");
                _this.li("Soyuz");
                _this.li("Space Shuttle");
            });
        });
    };
    return Spacecraft;
})(View);

var view = new Spacecraft();
view.find('ol').append('<li>Star Destroyer</li>');

view.on('click', 'li', function () {
    alert("They clicked on " + $(this).text());
});
