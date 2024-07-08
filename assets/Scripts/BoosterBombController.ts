import { _decorator, Component, Node } from 'cc';
import {IBlockBackUp, ISpriteBlocks} from "db://assets/Scripts/interfaces/Interfaces";
const { ccclass, property } = _decorator;

@ccclass('BoosterBombController')
export class BoosterBombController extends Component {

    private readonly _grid: ISpriteBlocks[][];
    private readonly _xCount: number;
    private readonly _yCount: number;
    private readonly _radius: number;

    constructor(xCount: number, yCount: number, grid: ISpriteBlocks[][], radius: number) {
        super();
        this._grid = grid;
        this._xCount = xCount;
        this._yCount = yCount;
        this._radius = radius;
    }

    activate(row: number, col: number): IBlockBackUp[] {
        const blocksBackUp: IBlockBackUp[] = []
        const isValidCell = (x: number, y: number) => { return x >= 0 && x < this._xCount && y >= 0 && y < this._yCount }
        for (let r = row - this._radius; r <= row + this._radius; r++) {
            for (let c = col - this._radius; c <= col + this._radius; c++) {
                if (isValidCell(r, c)) {
                    blocksBackUp.push({ ...this._grid[r][c], row: r, col: c })
                }
            }
        }
        return blocksBackUp;
    }
}


