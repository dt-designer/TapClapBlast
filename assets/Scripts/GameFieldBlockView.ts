import {_decorator, Component, instantiate, Node, Prefab, Sprite, tween, Vec3} from 'cc';
import {BlockType, BoosterType} from "db://assets/Scripts/interfaces/Interfaces";

const { ccclass, property } = _decorator;

@ccclass('GameFieldBlockView')
export class GameFieldBlockView extends Component {

    private readonly _blockNode: Node | null = null;
    private readonly _blockOffset: number = 0;

    private readonly _blockSprite: Node | null = null;
    private readonly _bangSprite: Node | null = null;
    private readonly _bombSprite: Node | null = null;
    private readonly _teleportSprite: Node | null = null;

    constructor(
        protected blockArea: Node,
        protected row: number,
        protected col: number,
        protected type: BlockType,
        protected prefab: Prefab,
        protected blockSize: number,
        private reborn: boolean | null = null,
        private siblingIndex: number | null = null,
    ) {
        super();



        this._blockNode = prefab ? instantiate(prefab) : null;
        if (this._blockNode) {
            this._blockOffset = 18 + (blockSize / 2);

            this._blockSprite = this._blockNode.getChildByName('Block')
            this._bangSprite = this._blockNode.getChildByName('Bang')
            this._bombSprite = this._blockNode.getChildByName('Bomb')
            this._teleportSprite = this._blockNode.getChildByName('Teleport')

            this._blockNode.setPosition((col * blockSize) + this._blockOffset, -(row * blockSize) - this._blockOffset - 8)
            this._blockNode.setParent(this.blockArea);
            if (reborn) {
                if (siblingIndex) {
                    this._blockNode.setSiblingIndex(siblingIndex)
                }
                if (this._blockSprite) {
                    this._blockSprite.setScale(new Vec3(0, 0))
                    tween(this._blockSprite)
                        .to(0.075, {scale: new Vec3(1.3, 1.3)}, {easing: 'linear'})
                        .to(0.025, {scale: new Vec3(1, 1)}, {easing: 'linear'})
                        .start()
                }
            }

            if (this._bangSprite) {
                this._bangSprite.setScale(new Vec3(0, 0))
            }

            if (this._bombSprite) {
                this._bombSprite.setScale(new Vec3(0, 0))
            }

            if (this._teleportSprite) {
                this._teleportSprite.setScale(new Vec3(0, 0))
            }
        }
    }

    get blockNode(): Node | null {
        return this._blockNode;
    }

    setBoosterIcon(type: BoosterType): void {
        switch (type) {
            case BoosterType.BOMB:
                if (this._bombSprite) {
                    tween(this._bombSprite).to(0.1, {scale: new Vec3(1, 1)}, {easing: 'linear'}).start()
                }
                break;
            case BoosterType.TELEPORT:
                if (this._teleportSprite) {
                    tween(this._teleportSprite).to(0.1, {scale: new Vec3(1, 1)}, {easing: 'linear'}).start()
                }
                break;
        }
    }

    updatePosition(row: number): void {
        const currentPosition = this._blockNode.getPosition();
        tween(this._blockNode)
            .to(0.2, {position: new Vec3(currentPosition.x, -(row * this.blockSize) - this._blockOffset - 8)}, {easing: 'linear'})
            .start()
    }

    wrongAttempt(): void {
        const position = this._blockNode.getPosition()
        tween(this._blockNode)
            .to(0.05, {position: new Vec3(position.x + 3, position.y)}, {easing: 'linear'})
            .to(0.05, {position: new Vec3(position.x - 6, position.y)}, {easing: 'linear'})
            .to(0.05, {position: new Vec3(position.x, position.y)}, {easing: 'linear'})
            .start()
    }

    async destroyBlock(withBang: boolean = true): Promise<void> {
        if (this._blockSprite) {
            tween(this._blockSprite).to(0.2, {scale: new Vec3(0, 0)}, {easing: 'linear'}).start()
        }

        if (this._bangSprite && withBang) {
            tween(this._bangSprite).to(0.2, {scale: new Vec3(1.8, 1.8)}, {easing: 'linear'}).start()
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        this.blockArea.removeChild(this._blockNode)
    }
}


