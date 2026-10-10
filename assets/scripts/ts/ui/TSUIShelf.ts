import { _decorator, Component, Node, instantiate } from 'cc';
import { TSSaveSystem, TSShelfSlotData } from '../game/TSSaveSystem';
import { TSUIShelfSlot } from './TSUIShelfSlot';
const { ccclass, property } = _decorator;

/**
 * 货架面板
 * 打开时强制刷新，展示所有货架格的解锁 / 上架状态。
 */
@ccclass('TSUIShelf')
export class TSUIShelf extends Component {
    @property(Node)
    public slotRoot: Node = null!;

    @property(Node)
    public slotTemplate: Node = null!;

    protected onLoad(): void {
        this.RefreshUI();
    }

    public RefreshUI(): void {
        if (!this.slotRoot || !this.slotTemplate) return;
        this.slotRoot.removeAllChildren();
        TSSaveSystem.data.shelfSlots.forEach((slot: TSShelfSlotData) => {
            const node = instantiate(this.slotTemplate);
            node.active = true;
            this.slotRoot.addChild(node);
            const comp = node.getComponent(TSUIShelfSlot);
            if (comp) comp.SetData(slot);
        });
    }

    public OnClose(): void {
        if (this.node && this.node.isValid) this.node.destroy();
    }
}
