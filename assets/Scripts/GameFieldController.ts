import { _decorator, Component, Node, Prefab } from 'cc';
import {BlockType, BoosterType, IBlockBackUp, ISpriteBlocks} from "db://assets/Scripts/interfaces/Interfaces";
import {GameFieldBlockView} from "db://assets/Scripts/GameFieldBlockView";
const { ccclass, property } = _decorator;

@ccclass('GameFieldController')
export class GameFieldController extends Component {

    @property({type: Node})
    public BlocksArea: Node | null = null;

    @property({type: Prefab})
    public TypeA_BoxPrefab: Prefab | null = null;

    @property({type: Prefab})
    public TypeB_BoxPrefab: Prefab | null = null;

    @property({type: Prefab})
    public TypeC_BoxPrefab: Prefab | null = null;

    @property({type: Prefab})
    public TypeD_BoxPrefab: Prefab | null = null;

    @property({type: Prefab})
    public TypeE_BoxPrefab: Prefab | null = null;

    private _XCount: number;
    private _YCount: number;
    private _blockSize: number;
    private _minBlockForBurn: number;
    private _gameFieldBlocks: ISpriteBlocks[][] = [];

    setSettings(XCount: number, YCount: number, blockSize: number, minBlockForBurn: number): void {
        this._XCount = XCount;
        this._YCount = YCount;
        this._blockSize = blockSize;
        this._minBlockForBurn = minBlockForBurn;
    }
    generateGameField(): void {
        this._gameFieldBlocks = [];
        this._gameFieldBlocks = Array.from({ length: this._XCount }, () =>
            Array.from({ length: this._YCount }, () => {
                return {type: this._generateSymbol(), control: null}
            })
        );
        for (let r = this._gameFieldBlocks.length - 1; r >= 0; r--) {
            for (let c = this._gameFieldBlocks[r].length - 1; c >= 0; c--) {
                this._gameFieldBlocks[r][c].control = this._spawnBlock(this._gameFieldBlocks[r][c].type, r, c)
            }
        }
    }
    getBlocks(): ISpriteBlocks[][] {
        return this._gameFieldBlocks;
    }
    async showBoosterIcon(row: number, col: number, boosterType: BoosterType): Promise<void> {
        this._gameFieldBlocks[row][col].control.setBoosterIcon(boosterType)
        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    async handleBlockBurning(blocksBackUp: IBlockBackUp[], isOutsideEffect: boolean = false): Promise<number> {
        if (isOutsideEffect) {
            for (let block of blocksBackUp) {
                this._gameFieldBlocks[block.row][block.col].type = BlockType.BT_N;
                this._gameFieldBlocks[block.row][block.col].control = null;
            }
        }
        if (blocksBackUp.length >= this._minBlockForBurn) {
            await this._destroyBlocks(blocksBackUp);

            // Задержка 200ms перед перемещением блоков вниз
            await new Promise((resolve) => setTimeout(resolve, 200));
            await this._moveUpperBlocksToBurned(this._XCount - 1, 0);

            // Задержка 200ms перед генерацией новых блоков сверху
            await new Promise((resolve) => setTimeout(resolve, 200));
            await this._respawnEmptyBlocks();
            return blocksBackUp.length;
        } else {

            this._restoreBlocks(blocksBackUp);
            return 0;
        }
    }
    async handleBlockChange(blocksBackUp: IBlockBackUp[], isOutsideEffect: boolean = false): Promise<number> {
        for (const block of blocksBackUp) {
            const siblingIndex = this._gameFieldBlocks[block.row][block.col].control.blockNode.getSiblingIndex();
            await this._gameFieldBlocks[block.row][block.col].control.destroyBlock(false);
            this._gameFieldBlocks[block.row][block.col] = { type: block.type, control: this._spawnBlock(block.type, block.row, block.col, true) }
            this._gameFieldBlocks[block.row][block.col].control.blockNode.setSiblingIndex(siblingIndex);
        }
        return 0;
    }

    async setBlockAction(type: BlockType, row: number, col: number): Promise<number> {
        return await this.checkNeighbors(type, row, col);
    }

    async checkNeighbors(type: BlockType, row: number, col: number, onlyHighlight?: boolean): Promise<number> { // Возвращаем колличество уничтоженых блоков
        const blocksBackUp: IBlockBackUp[] = []
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // Право, Низ, Лево, Верх

        // Функция для проверки ячейки и ее соседей
        const checkBlock = async (x: number, y: number) => {
            if (x >= 0 && x < this._XCount && y >= 0 && y < this._YCount && this._gameFieldBlocks[x][y].type === type) {

                // Выжигание ячейки
                this._gameFieldBlocks[x][y].control.toggleBlockMarked(true);
                blocksBackUp.push({ ...this._gameFieldBlocks[x][y], row: x, col: y });
                this._gameFieldBlocks[x][y].type = BlockType.BT_N;
                this._gameFieldBlocks[x][y].control = null;

                await new Promise((resolve) => setTimeout(resolve, 30));

                // Рекурсивный вызов для соседних ячеек
                for (const [dx, dy] of directions) {
                    await checkBlock(x + dx, y + dy);
                }
            }
        };

        // Запускаем поиск
        await checkBlock(row, col);
        if (!onlyHighlight) {
            return this.handleBlockBurning(blocksBackUp)
        }
    }

    private _generateSymbol(): BlockType {
        // Получаем массив со значениями Enum, кроме исключенного ключа
        const values = Object.values(BlockType).filter(
            (value: BlockType) => typeof value === 'number' && value !== BlockType.BT_N
        ) as BlockType[];
        // Функция для получения случайного символа из массива
        const getRandomSymbol = () => {
            const randomIndex = Math.floor(Math.random() * values.length);
            return values[randomIndex];
        };
        return getRandomSymbol()
    }
    private _spawnBlock(type: BlockType, row: number, col: number, reborn: boolean = false): GameFieldBlockView {
        let prefab: Prefab | null = null;
        switch (type) {
            case BlockType.BT_A:
                prefab = this.TypeA_BoxPrefab
                break;
            case BlockType.BT_B:
                prefab = this.TypeB_BoxPrefab
                break;
            case BlockType.BT_C:
                prefab = this.TypeC_BoxPrefab
                break;
            case BlockType.BT_D:
                prefab = this.TypeD_BoxPrefab
                break;
            case BlockType.BT_E:
                prefab = this.TypeE_BoxPrefab
                break;
        }
        return new GameFieldBlockView(this.BlocksArea, row, col, type, prefab, this._blockSize, reborn);
    }

    private _restoreBlocks(blocksBackUp: IBlockBackUp[]) {
        for (const block of blocksBackUp) {
            this._gameFieldBlocks[block.row][block.col].type = block.type
            this._gameFieldBlocks[block.row][block.col].control = block.control
            this._gameFieldBlocks[block.row][block.col].control.toggleBlockMarked(false);
            this._gameFieldBlocks[block.row][block.col].control.wrongAttempt()
        }
    }
    private async _respawnEmptyBlocks(): Promise<void> {
        for (let r = this._gameFieldBlocks.length - 1; r >= 0; r--) {
            for (let c = this._gameFieldBlocks[r].length - 1; c >= 0; c--) {
                if (this._gameFieldBlocks[r][c].type === BlockType.BT_N) {
                    this._gameFieldBlocks[r][c].type = this._generateSymbol()
                    this._gameFieldBlocks[r][c].control = this._spawnBlock(this._gameFieldBlocks[r][c].type, r, c, true)
                }
            }
        }
    }
    private async _moveUpperBlocksToBurned(row: number, col: number): Promise<void> {
        if ((row < 0 || row >= this._XCount - 1) && (col < 0 || col === this._YCount)) {
            return;
        }

        // Находим ближайшую ячейку сверху, не равную 0
        let foundedRow = Number(row);
        while (foundedRow >= 1 && this._gameFieldBlocks[foundedRow][col].type === BlockType.BT_N) {
            foundedRow--;
        }
        if (foundedRow >= 0 && foundedRow !== row) {
            this._gameFieldBlocks[row][col] = { ...this._gameFieldBlocks[foundedRow][col] };
            if (this._gameFieldBlocks[row][col].control) {
                this._gameFieldBlocks[row][col].control.updatePosition(row);
            }
            this._gameFieldBlocks[foundedRow][col].control = null;
            this._gameFieldBlocks[foundedRow][col].type = BlockType.BT_N;
        }

        if (foundedRow <= 0) {
            col++
            foundedRow = this._XCount - 1
        } else {
            foundedRow = row - 1
        }
        await this._moveUpperBlocksToBurned(foundedRow, col); // Рекурсивный вызов для следующей ячейки
    }
    private async _destroyBlocks(blocksBackUp: IBlockBackUp[]) {
        for (const block of blocksBackUp) {
            block.control.destroyBlock();
        }
    }
}


