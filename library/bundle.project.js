require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"HelloWorld":[function(require,module,exports){
"use strict";
cc._RFpush(module, '280c3rsZJJKnZ9RqbALVwtK', 'HelloWorld');
// Script/HelloWorld.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!'
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.label.string = this.text;
    },

    // called every frame
    update: function update(dt) {}
});

cc._RFpop();
},{}],"game":[function(require,module,exports){
"use strict";
cc._RFpush(module, '0aa3buExpRCBoxShj4kbC8n', 'game');
// Script/game.js

'use strict';

var MoveDirection = cc.Enum({
    NONE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
});

var minTilesCount = 2;
var mapMoveStep = 1;
var minMoveValue = 50;

cc.Class({
    extends: cc.Component,

    properties: {
        _touchStartPos: {
            default: null,
            serializable: false
        },
        _touching: {
            default: false,
            serializable: false
        },

        floorLayerName: 'floor',
        barrierLayerName: 'barrier',
        objectGroupName: 'players',
        startObjectName: 'SpawnPoint',
        successObjectName: 'SuccessPoint'
    },

    // use this for initialization
    onLoad: function onLoad() {
        var self = this;
        self._player = self.node.getChildByName('player');
        if (!self._isMapLoaded) {
            self._player.active = false;
        }

        // Add keyboard event.
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function onKeyPressed(keyCode, event) {
                self._onKeyPressed(keyCode, event);
            }
        }, self.node);
    },

    restart: function restart() {
        this._succeedLayer.active = false;
        this._initMapPosition();
        this._curTile = this._startTile;
        this._updatePlayerPos();
    },

    start: function start(err) {
        cc.log('Game start ...', err);
        if (err) {
            return;
        }

        var self = this;

        // Init the map position
        self._initMapPosition();

        // Init the succeed layer
        this._succeedLayer = this.node.getParent().getChildByName('successedLayer');
        this._succeedLayer.active = false;

        // Init the player position
        self._tiledMap = self.node.getComponent(cc.TiledMap);
        cc.log(self._tiledMap);
        var objectGroup = self._tiledMap.getObjectGroup(self.objectGroupName);
        cc.log(objectGroup);
        if (!objectGroup) return;

        // Load start object and end object from tited map.
        var startObj = objectGroup.getObject(this.startObjectName);
        var endObj = objectGroup.getObject(this.successObjectName);
        if (!startObj || !endObj) return;

        // Get start position and end position.
        var startPos = cc.p(startObj.sgNode.x, startObj.sgNode.y);
        var endPos = cc.p(endObj.sgNode.x, endObj.sgNode.y);

        // Get floor and barrier.
        this._layerFloor = this._tiledMap.getLayer(this.floorLayerName);
        this._layerBarrier = this._tiledMap.getLayer(this.barrierLayerName);
        if (!this._layerFloor || !this._layerBarrier) return;

        this._curTile = this._startTile = this._getTilePos(startPos);
        this._endTile = this._getTilePos(endPos);
        if (this._player) {
            this._updatePlayerPos();
            this._player.active = true;
        }

        this._isMapLoaded = true;
    },

    _initMapPosition: function _initMapPosition() {
        this.node.setPosition(cc.visibleRect.bottomLeft);
    },

    _updatePlayerPos: function _updatePlayerPos() {
        cc.log(this._curTile, this._curTile.x, this._curTile.y);
        var pos = this._layerFloor.getPositionAt(this._curTile);
        this._player.setPosition(pos);
    },

    _getTilePos: function _getTilePos(posInPixel) {
        var mapSize = this.node.getContentSize();
        var tileSize = this._tiledMap.getTileSize();
        var x = Math.floor(posInPixel.x / tileSize.width);
        var y = Math.floor((mapSize.height - posInPixel.y) / tileSize.height);

        return cc.p(x, y);
    },

    _onKeyPressed: function _onKeyPressed(keyCode, event) {
        if (!this._isMapLoaded || this._succeedLayer.active) {
            return;
        }

        var newTile = cc.p(this._curTile.x, this._curTile.y);
        var mapMoveDir = MoveDirection.NONE;
        switch (keyCode) {
            case cc.KEY.up:
                newTile.y -= 1;
                mapMoveDir = MoveDirection.DOWN;
                break;
            case cc.KEY.down:
                newTile.y += 1;
                mapMoveDir = MoveDirection.UP;
                break;
            case cc.KEY.left:
                newTile.x -= 1;
                mapMoveDir = MoveDirection.RIGHT;
                break;
            case cc.KEY.right:
                newTile.x += 1;
                mapMoveDir = MoveDirection.LEFT;
                break;
            default:
                return;
        }

        this._tryMoveToNewTile(newTile, mapMoveDir);
    },

    _tryMoveToNewTile: function _tryMoveToNewTile(newTile, mapMoveDir) {
        var mapSize = this._tiledMap.getMapSize();
        if (newTile.x < 0 || newTile.x >= mapSize.width) return;
        if (newTile.y < 0 || newTile.y >= mapSize.height) return;

        // If the newTile position in barrier layer of tited map, don't move.
        if (this._layerBarrier.getTileGIDAt(newTile)) {
            cc.log('This way is blocked!');
            return false;
        }

        // update the player position
        this._curTile = newTile;
        this._updatePlayerPos();

        // move the map if necessary
        this._tryMoveMap(mapMoveDir);

        // check the player is success or not
        if (cc.pointEqualToPoint(this._curTile, this._endTile)) {
            cc.log('succeed');
            this._succeedLayer.active = true;
        }
    },

    _tryMoveMap: function _tryMoveMap(moveDir) {
        // get necessary data
        var mapContentSize = this.node.getContentSize();
        var mapPos = this.node.getPosition();
        var playerPos = this._player.getPosition();
        var viewSize = cc.size(cc.visibleRect.width, cc.visibleRect.height);
        var tileSize = this._tiledMap.getTileSize();
        var minDisX = minTilesCount * tileSize.width;
        var minDisY = minTilesCount * tileSize.height;

        var disX = playerPos.x + mapPos.x;
        var disY = playerPos.y + mapPos.y;
        var newPos;
        switch (moveDir) {
            case MoveDirection.UP:
                if (disY < minDisY) {
                    newPos = cc.p(mapPos.x, mapPos.y + tileSize.height * mapMoveStep);
                }
                break;
            case MoveDirection.DOWN:
                if (viewSize.height - disY - tileSize.height < minDisY) {
                    newPos = cc.p(mapPos.x, mapPos.y - tileSize.height * mapMoveStep);
                }
                break;
            case MoveDirection.LEFT:
                if (viewSize.width - disX - tileSize.width < minDisX) {
                    newPos = cc.p(mapPos.x - tileSize.width * mapMoveStep, mapPos.y);
                }
                break;
            case MoveDirection.RIGHT:
                if (disX < minDisX) {
                    newPos = cc.p(mapPos.x + tileSize.width * mapMoveStep, mapPos.y);
                }
                break;
            default:
                return;
        }

        if (newPos) {
            // calculate the position range of map
            var minX = viewSize.width - mapContentSize.width - cc.visibleRect.left;
            var maxX = cc.visibleRect.left.x;
            var minY = viewSize.height - mapContentSize.height - cc.visibleRect.bottom;
            var maxY = cc.visibleRect.bottom.y;

            if (newPos.x < minX) newPos.x = minX;
            if (newPos.x > maxX) newPos.x = maxX;
            if (newPos.y < minY) newPos.y = minY;
            if (newPos.y > maxY) newPos.y = maxY;

            if (!cc.pointEqualToPoint(newPos, mapPos)) {
                cc.log('Move the map to new position: ', newPos);
                this.node.setPosition(newPos);
            }
        }
    }
});

cc._RFpop();
},{}],"loadScene":[function(require,module,exports){
"use strict";
cc._RFpush(module, '28288gGFLBEnJ9ThlLL1LcH', 'loadScene');
// Script/loadScene.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {}

});

cc._RFpop();
},{}]},{},["HelloWorld","game","loadScene"])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9TY3JpcHQvSGVsbG9Xb3JsZC5qcyIsImFzc2V0cy9TY3JpcHQvZ2FtZS5qcyIsImFzc2V0cy9TY3JpcHQvbG9hZFNjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTtBQUNJOztBQUVBO0FBQ0k7QUFDSTtBQUNBO0FBRkc7QUFJUDtBQUNBO0FBTlE7O0FBU1o7QUFDQTtBQUNJO0FBQ0g7O0FBRUQ7QUFDQTtBQWxCSzs7Ozs7Ozs7OztBQ0FUO0FBQ0k7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUx3Qjs7QUFRNUI7QUFDQTtBQUNBOztBQUVBO0FBQ0k7O0FBRUE7QUFDSTtBQUNJO0FBQ0E7QUFGWTtBQUloQjtBQUNJO0FBQ0E7QUFGTzs7QUFLWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBZFE7O0FBaUJaO0FBQ0E7QUFDSTtBQUNBO0FBQ0E7QUFDSTtBQUNIOztBQUVEO0FBQ0E7QUFDSTtBQUNBO0FBQ0k7QUFDSDtBQUp1QjtBQVMvQjs7QUFFRDtBQUNJO0FBQ0E7QUFDQTtBQUNBO0FBQ0g7O0FBRUQ7QUFDSTtBQUNBO0FBQVc7QUFBUzs7QUFFcEI7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDSTtBQUNBO0FBQ0g7O0FBRUQ7QUFDSDs7QUFFRDtBQUNJO0FBQ0g7O0FBRUQ7QUFDSTtBQUNBO0FBQ0E7QUFDSDs7QUFFRDtBQUNJO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0g7O0FBRUQ7QUFDSTtBQUF1RDtBQUFTOztBQUVoRTtBQUNBO0FBQ0E7QUFDSTtBQUNJO0FBQ0E7QUFDQTtBQUNKO0FBQ0k7QUFDQTtBQUNBO0FBQ0o7QUFDSTtBQUNBO0FBQ0E7QUFDSjtBQUNJO0FBQ0E7QUFDQTtBQUNKO0FBQ0k7QUFsQlI7O0FBcUJBO0FBQ0g7O0FBRUQ7QUFDSTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNJO0FBQ0E7QUFDSDs7QUFFRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0k7QUFDQTtBQUNIO0FBQ0o7O0FBRUQ7QUFDSTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0k7QUFDSTtBQUNJO0FBQ0g7QUFDRDtBQUNKO0FBQ0k7QUFDSTtBQUNIO0FBQ0Q7QUFDSjtBQUNJO0FBQ0k7QUFDSDtBQUNEO0FBQ0o7QUFDSTtBQUNJO0FBQ0g7QUFDRDtBQUNKO0FBQ0k7QUF0QlI7O0FBeUJBO0FBQ0k7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNJO0FBQ0E7QUFDSDtBQUNKO0FBQ0o7QUEzTkk7Ozs7Ozs7Ozs7QUNaVDtBQUNJOztBQUVBO0FBQ0k7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFWUTs7QUFhWjtBQUNBOztBQWpCSyIsInNvdXJjZXNDb250ZW50IjpbImNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGxhYmVsOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsLFxuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gZGVmYXVsdHMsIHNldCB2aXN1YWxseSB3aGVuIGF0dGFjaGluZyB0aGlzIHNjcmlwdCB0byB0aGUgQ2FudmFzXG4gICAgICAgIHRleHQ6ICdIZWxsbywgV29ybGQhJ1xuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sYWJlbC5zdHJpbmcgPSB0aGlzLnRleHQ7XG4gICAgfSxcblxuICAgIC8vIGNhbGxlZCBldmVyeSBmcmFtZVxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKGR0KSB7XG5cbiAgICB9LFxufSk7XG4iLCJ2YXIgTW92ZURpcmVjdGlvbiA9IGNjLkVudW0oe1xuICAgIE5PTkU6IDAsXG4gICAgVVA6IDEsXG4gICAgRE9XTjogMiwgXG4gICAgTEVGVDogMyxcbiAgICBSSUdIVDogNFxufSk7XG5cbnZhciBtaW5UaWxlc0NvdW50ID0gMjtcbnZhciBtYXBNb3ZlU3RlcCA9IDE7XG52YXIgbWluTW92ZVZhbHVlID0gNTA7XG5cbmNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIF90b3VjaFN0YXJ0UG9zOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsLFxuICAgICAgICAgICAgc2VyaWFsaXphYmxlOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgX3RvdWNoaW5nOiB7XG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgIHNlcmlhbGl6YWJsZTogZmFsc2UsXG4gICAgICAgIH0sXG5cbiAgICAgICAgZmxvb3JMYXllck5hbWU6ICdmbG9vcicsXG4gICAgICAgIGJhcnJpZXJMYXllck5hbWU6ICdiYXJyaWVyJyxcbiAgICAgICAgb2JqZWN0R3JvdXBOYW1lOiAncGxheWVycycsXG4gICAgICAgIHN0YXJ0T2JqZWN0TmFtZTogJ1NwYXduUG9pbnQnLFxuICAgICAgICBzdWNjZXNzT2JqZWN0TmFtZTogJ1N1Y2Nlc3NQb2ludCdcbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgb25Mb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5fcGxheWVyID0gc2VsZi5ub2RlLmdldENoaWxkQnlOYW1lKCdwbGF5ZXInKTtcbiAgICAgICAgaWYgKCEgc2VsZi5faXNNYXBMb2FkZWQpIHtcbiAgICAgICAgICAgIHNlbGYuX3BsYXllci5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBrZXlib2FyZCBldmVudC5cbiAgICAgICAgY2MuZXZlbnRNYW5hZ2VyLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIGV2ZW50OiBjYy5FdmVudExpc3RlbmVyLktFWUJPQVJELFxuICAgICAgICAgICAgb25LZXlQcmVzc2VkOiBmdW5jdGlvbihrZXlDb2RlLCBldmVudCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uS2V5UHJlc3NlZChrZXlDb2RlLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHNlbGYubm9kZSk7XG5cblxuICAgIFxuICAgIH0sXG5cbiAgICByZXN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc3VjY2VlZExheWVyLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pbml0TWFwUG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5fY3VyVGlsZSA9IHRoaXMuX3N0YXJ0VGlsZTtcbiAgICAgICAgdGhpcy5fdXBkYXRlUGxheWVyUG9zKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY2MubG9nKCdHYW1lIHN0YXJ0IC4uLicsIGVycik7XG4gICAgICAgIGlmIChlcnIpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIEluaXQgdGhlIG1hcCBwb3NpdGlvblxuICAgICAgICBzZWxmLl9pbml0TWFwUG9zaXRpb24oKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXQgdGhlIHN1Y2NlZWQgbGF5ZXJcbiAgICAgICAgdGhpcy5fc3VjY2VlZExheWVyID0gdGhpcy5ub2RlLmdldFBhcmVudCgpLmdldENoaWxkQnlOYW1lKCdzdWNjZXNzZWRMYXllcicpO1xuICAgICAgICB0aGlzLl9zdWNjZWVkTGF5ZXIuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0IHRoZSBwbGF5ZXIgcG9zaXRpb25cbiAgICAgICAgc2VsZi5fdGlsZWRNYXAgPSBzZWxmLm5vZGUuZ2V0Q29tcG9uZW50KGNjLlRpbGVkTWFwKTtcbiAgICAgICAgY2MubG9nKHNlbGYuX3RpbGVkTWFwKTtcbiAgICAgICAgdmFyIG9iamVjdEdyb3VwID0gc2VsZi5fdGlsZWRNYXAuZ2V0T2JqZWN0R3JvdXAoc2VsZi5vYmplY3RHcm91cE5hbWUpO1xuICAgICAgICBjYy5sb2cob2JqZWN0R3JvdXApO1xuICAgICAgICBpZiAoIW9iamVjdEdyb3VwKSByZXR1cm47XG5cbiAgICAgICAgLy8gTG9hZCBzdGFydCBvYmplY3QgYW5kIGVuZCBvYmplY3QgZnJvbSB0aXRlZCBtYXAuXG4gICAgICAgIHZhciBzdGFydE9iaiA9IG9iamVjdEdyb3VwLmdldE9iamVjdCh0aGlzLnN0YXJ0T2JqZWN0TmFtZSk7XG4gICAgICAgIHZhciBlbmRPYmogPSBvYmplY3RHcm91cC5nZXRPYmplY3QodGhpcy5zdWNjZXNzT2JqZWN0TmFtZSk7XG4gICAgICAgIGlmICghc3RhcnRPYmogfHwgIWVuZE9iaikgcmV0dXJuO1xuXG4gICAgICAgIC8vIEdldCBzdGFydCBwb3NpdGlvbiBhbmQgZW5kIHBvc2l0aW9uLlxuICAgICAgICB2YXIgc3RhcnRQb3MgPSBjYy5wKHN0YXJ0T2JqLnNnTm9kZS54LCBzdGFydE9iai5zZ05vZGUueSk7XG4gICAgICAgIHZhciBlbmRQb3MgPSBjYy5wKGVuZE9iai5zZ05vZGUueCwgZW5kT2JqLnNnTm9kZS55KTtcblxuICAgICAgICAvLyBHZXQgZmxvb3IgYW5kIGJhcnJpZXIuXG4gICAgICAgIHRoaXMuX2xheWVyRmxvb3IgPSB0aGlzLl90aWxlZE1hcC5nZXRMYXllcih0aGlzLmZsb29yTGF5ZXJOYW1lKTtcbiAgICAgICAgdGhpcy5fbGF5ZXJCYXJyaWVyID0gdGhpcy5fdGlsZWRNYXAuZ2V0TGF5ZXIodGhpcy5iYXJyaWVyTGF5ZXJOYW1lKTtcbiAgICAgICAgaWYgKCF0aGlzLl9sYXllckZsb29yIHx8ICF0aGlzLl9sYXllckJhcnJpZXIpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9jdXJUaWxlID0gdGhpcy5fc3RhcnRUaWxlID0gdGhpcy5fZ2V0VGlsZVBvcyhzdGFydFBvcyk7XG4gICAgICAgIHRoaXMuX2VuZFRpbGUgPSB0aGlzLl9nZXRUaWxlUG9zKGVuZFBvcyk7XG4gICAgICAgIGlmICh0aGlzLl9wbGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllclBvcygpO1xuICAgICAgICAgICAgdGhpcy5fcGxheWVyLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pc01hcExvYWRlZCA9IHRydWU7XG4gICAgfSxcblxuICAgIF9pbml0TWFwUG9zaXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm5vZGUuc2V0UG9zaXRpb24oY2MudmlzaWJsZVJlY3QuYm90dG9tTGVmdCk7XG4gICAgfSxcblxuICAgIF91cGRhdGVQbGF5ZXJQb3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjYy5sb2codGhpcy5fY3VyVGlsZSwgdGhpcy5fY3VyVGlsZS54LCB0aGlzLl9jdXJUaWxlLnkpO1xuICAgICAgICB2YXIgcG9zID0gdGhpcy5fbGF5ZXJGbG9vci5nZXRQb3NpdGlvbkF0KHRoaXMuX2N1clRpbGUpO1xuICAgICAgICB0aGlzLl9wbGF5ZXIuc2V0UG9zaXRpb24ocG9zKTtcbiAgICB9LFxuXG4gICAgX2dldFRpbGVQb3M6IGZ1bmN0aW9uKHBvc0luUGl4ZWwpIHtcbiAgICAgICAgdmFyIG1hcFNpemUgPSB0aGlzLm5vZGUuZ2V0Q29udGVudFNpemUoKTtcbiAgICAgICAgdmFyIHRpbGVTaXplID0gdGhpcy5fdGlsZWRNYXAuZ2V0VGlsZVNpemUoKTtcbiAgICAgICAgdmFyIHggPSBNYXRoLmZsb29yKHBvc0luUGl4ZWwueCAvIHRpbGVTaXplLndpZHRoKTtcbiAgICAgICAgdmFyIHkgPSBNYXRoLmZsb29yKChtYXBTaXplLmhlaWdodCAtIHBvc0luUGl4ZWwueSkgLyB0aWxlU2l6ZS5oZWlnaHQpO1xuXG4gICAgICAgIHJldHVybiBjYy5wKHgsIHkpO1xuICAgIH0sXG5cbiAgICBfb25LZXlQcmVzc2VkOiBmdW5jdGlvbihrZXlDb2RlLCBldmVudCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzTWFwTG9hZGVkIHx8IHRoaXMuX3N1Y2NlZWRMYXllci5hY3RpdmUpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIG5ld1RpbGUgPSBjYy5wKHRoaXMuX2N1clRpbGUueCwgdGhpcy5fY3VyVGlsZS55KTtcbiAgICAgICAgdmFyIG1hcE1vdmVEaXIgPSBNb3ZlRGlyZWN0aW9uLk5PTkU7XG4gICAgICAgIHN3aXRjaChrZXlDb2RlKSB7XG4gICAgICAgICAgICBjYXNlIGNjLktFWS51cDpcbiAgICAgICAgICAgICAgICBuZXdUaWxlLnkgLT0gMTtcbiAgICAgICAgICAgICAgICBtYXBNb3ZlRGlyID0gTW92ZURpcmVjdGlvbi5ET1dOO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBjYy5LRVkuZG93bjpcbiAgICAgICAgICAgICAgICBuZXdUaWxlLnkgKz0gMTtcbiAgICAgICAgICAgICAgICBtYXBNb3ZlRGlyID0gTW92ZURpcmVjdGlvbi5VUDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgY2MuS0VZLmxlZnQ6XG4gICAgICAgICAgICAgICAgbmV3VGlsZS54IC09IDE7XG4gICAgICAgICAgICAgICAgbWFwTW92ZURpciA9IE1vdmVEaXJlY3Rpb24uUklHSFQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGNjLktFWS5yaWdodDpcbiAgICAgICAgICAgICAgICBuZXdUaWxlLnggKz0gMTtcbiAgICAgICAgICAgICAgICBtYXBNb3ZlRGlyID0gTW92ZURpcmVjdGlvbi5MRUZUO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl90cnlNb3ZlVG9OZXdUaWxlKG5ld1RpbGUsIG1hcE1vdmVEaXIpO1xuICAgIH0sXG5cbiAgICBfdHJ5TW92ZVRvTmV3VGlsZTogZnVuY3Rpb24obmV3VGlsZSwgbWFwTW92ZURpcikge1xuICAgICAgICB2YXIgbWFwU2l6ZSA9IHRoaXMuX3RpbGVkTWFwLmdldE1hcFNpemUoKTtcbiAgICAgICAgaWYgKG5ld1RpbGUueCA8IDAgfHwgbmV3VGlsZS54ID49IG1hcFNpemUud2lkdGgpIHJldHVybjtcbiAgICAgICAgaWYgKG5ld1RpbGUueSA8IDAgfHwgbmV3VGlsZS55ID49IG1hcFNpemUuaGVpZ2h0KSByZXR1cm47XG5cbiAgICAgICAgLy8gSWYgdGhlIG5ld1RpbGUgcG9zaXRpb24gaW4gYmFycmllciBsYXllciBvZiB0aXRlZCBtYXAsIGRvbid0IG1vdmUuXG4gICAgICAgIGlmICh0aGlzLl9sYXllckJhcnJpZXIuZ2V0VGlsZUdJREF0KG5ld1RpbGUpKSB7XG4gICAgICAgICAgICBjYy5sb2coJ1RoaXMgd2F5IGlzIGJsb2NrZWQhJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB1cGRhdGUgdGhlIHBsYXllciBwb3NpdGlvblxuICAgICAgICB0aGlzLl9jdXJUaWxlID0gbmV3VGlsZTtcbiAgICAgICAgdGhpcy5fdXBkYXRlUGxheWVyUG9zKCk7XG5cbiAgICAgICAgLy8gbW92ZSB0aGUgbWFwIGlmIG5lY2Vzc2FyeVxuICAgICAgICB0aGlzLl90cnlNb3ZlTWFwKG1hcE1vdmVEaXIpO1xuXG4gICAgICAgIC8vIGNoZWNrIHRoZSBwbGF5ZXIgaXMgc3VjY2VzcyBvciBub3RcbiAgICAgICAgaWYgKGNjLnBvaW50RXF1YWxUb1BvaW50KHRoaXMuX2N1clRpbGUsIHRoaXMuX2VuZFRpbGUpKSB7XG4gICAgICAgICAgICBjYy5sb2coJ3N1Y2NlZWQnKTtcbiAgICAgICAgICAgIHRoaXMuX3N1Y2NlZWRMYXllci5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF90cnlNb3ZlTWFwOiBmdW5jdGlvbihtb3ZlRGlyKSB7XG4gICAgICAgIC8vIGdldCBuZWNlc3NhcnkgZGF0YVxuICAgICAgICB2YXIgbWFwQ29udGVudFNpemUgPSB0aGlzLm5vZGUuZ2V0Q29udGVudFNpemUoKTtcbiAgICAgICAgdmFyIG1hcFBvcyA9IHRoaXMubm9kZS5nZXRQb3NpdGlvbigpO1xuICAgICAgICB2YXIgcGxheWVyUG9zID0gdGhpcy5fcGxheWVyLmdldFBvc2l0aW9uKCk7XG4gICAgICAgIHZhciB2aWV3U2l6ZSA9IGNjLnNpemUoY2MudmlzaWJsZVJlY3Qud2lkdGgsIGNjLnZpc2libGVSZWN0LmhlaWdodCk7XG4gICAgICAgIHZhciB0aWxlU2l6ZSA9IHRoaXMuX3RpbGVkTWFwLmdldFRpbGVTaXplKCk7XG4gICAgICAgIHZhciBtaW5EaXNYID0gbWluVGlsZXNDb3VudCAqIHRpbGVTaXplLndpZHRoO1xuICAgICAgICB2YXIgbWluRGlzWSA9IG1pblRpbGVzQ291bnQgKiB0aWxlU2l6ZS5oZWlnaHQ7XG5cbiAgICAgICAgdmFyIGRpc1ggPSBwbGF5ZXJQb3MueCArIG1hcFBvcy54O1xuICAgICAgICB2YXIgZGlzWSA9IHBsYXllclBvcy55ICsgbWFwUG9zLnk7XG4gICAgICAgIHZhciBuZXdQb3M7XG4gICAgICAgIHN3aXRjaCAobW92ZURpcikge1xuICAgICAgICAgICAgY2FzZSBNb3ZlRGlyZWN0aW9uLlVQOlxuICAgICAgICAgICAgICAgIGlmIChkaXNZIDwgbWluRGlzWSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdQb3MgPSBjYy5wKG1hcFBvcy54LCBtYXBQb3MueSArIHRpbGVTaXplLmhlaWdodCAqIG1hcE1vdmVTdGVwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1vdmVEaXJlY3Rpb24uRE9XTjpcbiAgICAgICAgICAgICAgICBpZiAodmlld1NpemUuaGVpZ2h0IC0gZGlzWSAtIHRpbGVTaXplLmhlaWdodCA8IG1pbkRpc1kpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3UG9zID0gY2MucChtYXBQb3MueCwgbWFwUG9zLnkgLSB0aWxlU2l6ZS5oZWlnaHQgKiBtYXBNb3ZlU3RlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBNb3ZlRGlyZWN0aW9uLkxFRlQ6XG4gICAgICAgICAgICAgICAgaWYgKHZpZXdTaXplLndpZHRoIC0gZGlzWCAtIHRpbGVTaXplLndpZHRoIDwgbWluRGlzWCkge1xuICAgICAgICAgICAgICAgICAgICBuZXdQb3MgPSBjYy5wKG1hcFBvcy54IC0gdGlsZVNpemUud2lkdGggKiBtYXBNb3ZlU3RlcCwgbWFwUG9zLnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTW92ZURpcmVjdGlvbi5SSUdIVDpcbiAgICAgICAgICAgICAgICBpZiAoZGlzWCA8IG1pbkRpc1gpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3UG9zID0gY2MucChtYXBQb3MueCArIHRpbGVTaXplLndpZHRoICogbWFwTW92ZVN0ZXAsIG1hcFBvcy55KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdQb3MpIHtcbiAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgcG9zaXRpb24gcmFuZ2Ugb2YgbWFwXG4gICAgICAgICAgICB2YXIgbWluWCA9IHZpZXdTaXplLndpZHRoIC0gbWFwQ29udGVudFNpemUud2lkdGggLSBjYy52aXNpYmxlUmVjdC5sZWZ0O1xuICAgICAgICAgICAgdmFyIG1heFggPSBjYy52aXNpYmxlUmVjdC5sZWZ0Lng7XG4gICAgICAgICAgICB2YXIgbWluWSA9IHZpZXdTaXplLmhlaWdodCAtIG1hcENvbnRlbnRTaXplLmhlaWdodCAtIGNjLnZpc2libGVSZWN0LmJvdHRvbTtcbiAgICAgICAgICAgIHZhciBtYXhZID0gY2MudmlzaWJsZVJlY3QuYm90dG9tLnk7XG5cbiAgICAgICAgICAgIGlmIChuZXdQb3MueCA8IG1pblgpIG5ld1Bvcy54ID0gbWluWDtcbiAgICAgICAgICAgIGlmIChuZXdQb3MueCA+IG1heFgpIG5ld1Bvcy54ID0gbWF4WDtcbiAgICAgICAgICAgIGlmIChuZXdQb3MueSA8IG1pblkpIG5ld1Bvcy55ID0gbWluWTtcbiAgICAgICAgICAgIGlmIChuZXdQb3MueSA+IG1heFkpIG5ld1Bvcy55ID0gbWF4WTtcblxuICAgICAgICAgICAgaWYgKCFjYy5wb2ludEVxdWFsVG9Qb2ludChuZXdQb3MsIG1hcFBvcykpIHtcbiAgICAgICAgICAgICAgICBjYy5sb2coJ01vdmUgdGhlIG1hcCB0byBuZXcgcG9zaXRpb246ICcsIG5ld1Bvcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlLnNldFBvc2l0aW9uKG5ld1Bvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsImNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIC8vIGZvbzoge1xuICAgICAgICAvLyAgICBkZWZhdWx0OiBudWxsLCAgICAgIC8vIFRoZSBkZWZhdWx0IHZhbHVlIHdpbGwgYmUgdXNlZCBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBhdHRhY2hpbmdcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICB0byBhIG5vZGUgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgIC8vICAgIHVybDogY2MuVGV4dHVyZTJELCAgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgdHlwZW9mIGRlZmF1bHRcbiAgICAgICAgLy8gICAgc2VyaWFsaXphYmxlOiB0cnVlLCAvLyBvcHRpb25hbCwgZGVmYXVsdCBpcyB0cnVlXG4gICAgICAgIC8vICAgIHZpc2libGU6IHRydWUsICAgICAgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgdHJ1ZVxuICAgICAgICAvLyAgICBkaXNwbGF5TmFtZTogJ0ZvbycsIC8vIG9wdGlvbmFsXG4gICAgICAgIC8vICAgIHJlYWRvbmx5OiBmYWxzZSwgICAgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgZmFsc2VcbiAgICAgICAgLy8gfSxcbiAgICAgICAgLy8gLi4uXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gKCkge1xuXG4gICAgfSxcblxuICAgIC8vIGNhbGxlZCBldmVyeSBmcmFtZSwgdW5jb21tZW50IHRoaXMgZnVuY3Rpb24gdG8gYWN0aXZhdGUgdXBkYXRlIGNhbGxiYWNrXG4gICAgLy8gdXBkYXRlOiBmdW5jdGlvbiAoZHQpIHtcblxuICAgIC8vIH0sXG59KTtcbiJdLCJzb3VyY2VSb290IjoiIn0=