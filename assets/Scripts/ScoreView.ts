import { _decorator, Component, Label, Node } from 'cc';
import {IScoreEvent} from "db://assets/Scripts/interfaces/Interfaces";
const { ccclass, property } = _decorator;

@ccclass('ScoreController')
export class ScoreController extends Component {

    @property({ type: Node })
    SubjectNode: Node

    @property({ type: Label })
    StepsLabel: Label

    @property({ type: Label })
    ScoreLabel: Label

    public drawSteps(availableSteps: number): void {
        this.StepsLabel.string = String(availableSteps);
    }

    public drawScore(score: number): void {
        this.ScoreLabel.string = String(score);
    }

    start() {
        this.SubjectNode.on('ScoreEvent', (args: IScoreEvent) => {
            if (args.availableSteps !== null) {
                this.drawSteps(args.availableSteps)
            }
            if (args.score !== null) {
                this.drawScore(args.score)
            }
        }, this);
    }
}


