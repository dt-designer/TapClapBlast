import {_decorator, CCInteger, Component, director, JsonAsset, Node, resources} from 'cc';
import {
    BlockType, BombBoosterSettings,
    Booster,
    BoosterTeleportStep,
    BoosterType,
    ISpriteBlocks, TeleportBoosterTemp
} from "db://assets/Scripts/interfaces/Interfaces";
import {GameFieldController} from "db://assets/Scripts/GameFieldController";
import {BoosterBombController} from "db://assets/Scripts/BoosterBombController";
import {BoosterTeleportContr} from "db://assets/Scripts/BoosterTeleportController";

const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {

    @property({type: Node})
    public GameOverNode: Node | null = null;

    @property({type: Node})
    public WinnerNode: Node | null = null;

    @property({type: Node})
    public GameFieldNode: Node | null = null;

    @property({type: CCInteger})
    public BlockSize: number = 75;

    @property({type: CCInteger})
    public XCount: number = 10;

    @property({type: CCInteger})
    public YCount: number = 9;

    @property({type: CCInteger})
    public MinBlocksForBurn: number = 3;

    private _score: number = 0;
    private _availableSteps: number = 1;
    private _requiredScore: number = 0;
    private _gameField: GameFieldController | null = null;
    private _gameFieldBlocks: ISpriteBlocks[][] = [];

    private _boosters: {bomb: Booster<BombBoosterSettings>, teleport: Booster<{}, TeleportBoosterTemp>} = {
        bomb: {
            count: 0,
            active: false,
            settings: {
                indent: 2
            }
        },
        teleport: {
            count: 0,
            active: false,
            temp: {
                step: BoosterTeleportStep.FIRST,
                row: 0,
                col: 0,
            }
        }
    }


    startGame(): void {
        this.GameOverNode.active = false;
        this.WinnerNode.active = false;
        this._score = 0;
        director.getScene()
            .getChildByName('GameCanvas').getChildByName('GameField').getChildByName('GF_Area').removeAllChildren()
        resources.load('level_1', JsonAsset, (err, asset)=>{
            this._availableSteps = asset.json.steps
            this._requiredScore = asset.json.score
            this._boosters.bomb.count = asset.json.bonuses.bomb;
            this._boosters.teleport.count = asset.json.bonuses.teleport;

            this.node.emit('ScoreEvent', {availableSteps: this._availableSteps, score: this._score, requiredScore: this._requiredScore});

            this.node.emit('BoosterEvent', {type: BoosterType.BOMB, leftTries: this._boosters.bomb.count, btnActive: this._boosters.bomb.active});
            this.node.emit('BoosterEvent', {type: BoosterType.TELEPORT, leftTries: this._boosters.teleport.count, btnActive: this._boosters.teleport.active});

            this._gameField = this.GameFieldNode.getComponent(GameFieldController)

            this._gameField.setSettings(this.XCount, this.YCount, this.BlockSize, this.MinBlocksForBurn)
            this._gameField.generateGameField();

            this._gameFieldBlocks = this._gameField.getBlocks()
            this._addEventsToBlocks();
        });
    }

    activateBombBooster(): void {
        if (this._boosters.bomb.count > 0 || this._boosters.bomb.active) {
            this._boosters.bomb.active = !this._boosters.bomb.active;
            this.node.emit('BoosterEvent', {type: BoosterType.BOMB, leftTries: this._boosters.bomb.count, btnActive: this._boosters.bomb.active});
        }
    }
    activateTeleportBooster(): void {
        if (this._boosters.teleport.count > 0 || this._boosters.teleport.active) {
            this._boosters.teleport.active = !this._boosters.teleport.active;
            this.node.emit('BoosterEvent', {type: BoosterType.TELEPORT, leftTries: this._boosters.teleport.count, btnActive: this._boosters.teleport.active});
        }
    }

    private async _boosterBombAction(row: number, col: number): void {
        await this._gameField.showBoosterIcon(row, col, BoosterType.BOMB);
        const boosterController = new BoosterBombController(this.XCount, this.YCount, this._gameFieldBlocks, this._boosters.bomb.settings.indent);
        const blocksForRemove = boosterController.activate(row, col);
        this._gameField.handleBlockBurning(blocksForRemove, true).then((count) => {
            this._handleScore(count);
            this._boosters.bomb.count--;
            this.activateBombBooster();
        });
    }
    private _boosterTeleportAction(row: number, col: number): void {
        if (!this._boosters.teleport.temp || this._boosters.teleport.temp?.step === BoosterTeleportStep.FIRST) {
            this._gameField.showBoosterIcon(row, col, BoosterType.TELEPORT);
            this._boosters.teleport.temp = {
                step: BoosterTeleportStep.SECOND,
                row,
                col
            };
            this._addEventsToBlocks();
        } else if (this._boosters.teleport.temp.step === BoosterTeleportStep.SECOND) {
            const firstRow = this._boosters.teleport.temp.row
            const firstCol = this._boosters.teleport.temp.col
            const boosterController = new BoosterTeleportContr(this._gameFieldBlocks)
            const blocksForChange = boosterController.activate(firstRow, firstCol, row, col);
            this._gameField.handleBlockChange(blocksForChange, true).then((count) => {
                this._handleScore(count);
                this._boosters.teleport.count--;
                this.activateTeleportBooster();
            });
            this._boosters.teleport.temp = null;
        }
    }

    private _blockAction(type: BlockType, row: number, col: number): void {
        this._removeEventsFromBlocks();
        if (this._boosters.bomb.active) {
            this._boosterBombAction(row, col);
        } else if (this._boosters.teleport.active) {
            this._boosterTeleportAction(row, col)
        } else {
            this._gameField.setBlockAction(type, row, col).then((count) => this._handleScore(count));
        }
    }
    private _handleScore(count: number) {
        if (count > 0) {
            this._availableSteps--;
            this._score += count;
            this.node.emit('ScoreEvent', {availableSteps: this._availableSteps, score: this._score, requiredScore: this._requiredScore});
        }

        this._gameFieldBlocks = this._gameField.getBlocks();

        if (this._availableSteps > 0 && this._score < this._requiredScore) {
            this._addEventsToBlocks();
        } else if (this._score >= this._requiredScore) {
            this.WinnerNode.active = true;
        } else {
            this.GameOverNode.active = true;
        }
    }
    private _addEventsToBlocks(): void {
        for (let row = 0; row < this._gameFieldBlocks.length; row++) {
            for (let col = 0; col < this._gameFieldBlocks[row].length; col++) {
                if (this._gameFieldBlocks[row][col].control) {
                    this._gameFieldBlocks[row][col].control.blockNode
                        .on(Node.EventType.MOUSE_DOWN, () =>
                            this._blockAction(this._gameFieldBlocks[row][col].type, row, col), this);
                }
            }
        }
    }
    private _removeEventsFromBlocks(): void {
        for (const row of this._gameFieldBlocks) {
            for (const block of row) {
                if (block.control) {
                    block.control.blockNode.off(Node.EventType.MOUSE_DOWN);
                }
            }
        }
    }

    start() {
        this.startGame()
    }
}


