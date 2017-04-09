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