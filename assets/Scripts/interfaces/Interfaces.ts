import {GameFieldBlockView} from "db://assets/Scripts/GameFieldBlockView";

export enum BlockType {
    BT_N,
    BT_A,
    BT_B,
    BT_C,
    BT_D,
    BT_E,
}

export enum BoosterType {
    BOMB = 'bomb',
    TELEPORT = 'teleport'
}

export enum BoosterTeleportStep {
    FIRST,
    SECOND
}

export interface Booster<TSettings = {}, TTemp = {}, TOther = {}> {
    count: number;
    active: boolean;
    settings?: TSettings;
    temp?: TTemp;
    other?: TOther;
}

export interface BombBoosterSettings {
    indent: number;
}

export interface TeleportBoosterTemp {
    step: BoosterTeleportStep;
    row: number;
    col: number;
}

export interface IScoreEvent {
    availableSteps: number,
    requiredScore: number
    score: number,
}

export interface IBoosterEvent {
    type: BoosterType,
    leftTries: number,
    btnActive: boolean
}

export interface ISpriteBlocks {
    type: BlockType;
    control: GameFieldBlockView | null
}

export interface IBlockBackUp extends ISpriteBlocks {
    row: number;
    col: number;
}