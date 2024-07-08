import { _decorator, Component, Label, Node } from 'cc';
import {BoosterType, IBoosterEvent} from "db://assets/Scripts/interfaces/Interfaces";
const { ccclass, property } = _decorator;

@ccclass('BoosterBtnBombController')
export class BoosterBtnBombController extends Component {

    @property({ type: Node })
    SubjectNode: Node

    @property({ type: Label })
    leftTriesLabel: Label

    @property({ type: Node })
    BtnActiveNode: Node

    @property({ type: Node })
    BtnInactiveNode: Node

    @property({ type: String })
    BoosterType: BoosterType

    public drawLeftCount(leftTries: number): void {
        this.leftTriesLabel.string = String(leftTries)
    }

    public toggleActiveBtn(state: boolean): void {
        this.BtnActiveNode.active = state
        this.BtnInactiveNode.active = !state
    }

    start() {
        this.BtnActiveNode.active = false
        this.BtnInactiveNode.active = true
        this.SubjectNode.on('BoosterEvent', (args: IBoosterEvent) => {
            if (args.type === this.BoosterType) {
                if (args.leftTries !== null) {
                    this.drawLeftCount(args.leftTries)
                }
                if (args.btnActive !== null) {
                    this.toggleActiveBtn(args.btnActive)
                }
            }
        }, this);
    }
}


