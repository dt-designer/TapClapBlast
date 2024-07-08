import { _decorator, Component, Label, Node, ProgressBar } from 'cc';
import {IScoreEvent} from 'db://assets/Scripts/interfaces/Interfaces';
const { ccclass, property } = _decorator;

@ccclass('HeaderController')
export class HeaderController extends Component {

    @property({ type: Node })
    SubjectNode: Node

    @property({ type: Label })
    RequiredScore: Label

    @property({ type: ProgressBar })
    ProgressBar: ProgressBar

    public drawRequiredScore(requiredScore: number): void {
        this.RequiredScore.string = String(requiredScore);
    }

    private _setProgress(score: number, requiredScore: number): void {
        const step = requiredScore / 100;
        const progress = score / step;
        this.ProgressBar.progress = progress / 100;
    }

    start() {
        this.ProgressBar.progress = 0;
        this.SubjectNode.on('ScoreEvent', (args: IScoreEvent) => {
            if (args.requiredScore !== null) {
                this.drawRequiredScore(args.requiredScore)
            }
            if (args.score !== null) {
                this._setProgress(args.score, args.requiredScore)
            }
        }, this);
    }
}


