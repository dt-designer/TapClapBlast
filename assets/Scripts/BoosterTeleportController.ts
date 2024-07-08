import { _decorator, Component, Node } from 'cc';
import {IBlockBackUp, ISpriteBlocks} from "db://assets/Scripts/interfaces/Interfaces";
const { ccclass, property } = _decorator;

@ccclass('BoosterTeleportContr')
export class BoosterTeleportContr extends Component {

    private readonly _grid: ISpriteBlocks[][];

    constructor(grid: ISpriteBlocks[][]) {
        super();
        this._grid = grid;
    }

    activate(firstRow: number, firstCol: number, secondRow: number, secondCol: number): IBlockBackUp[] {
        const changedBlocks: IBlockBackUp[] = [];
        const firstBlock = this._grid[firstRow][firstCol];
        const secondBlock = this._grid[secondRow][secondCol];

        if (firstBlock && secondBlock && firstBlock.type !== secondBlock.type) {
            changedBlocks.push({ ...firstBlock, row: secondRow, col: secondCol });
            changedBlocks.push({ ...secondBlock, row: firstRow, col: firstCol });
            return changedBlocks;
        }
        return null;
    }
}


