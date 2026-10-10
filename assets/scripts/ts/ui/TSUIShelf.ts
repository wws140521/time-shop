import { _decorator, Component, Node, Label, Prefab, instantiate } from 'cc';
import { TSShelfSystem } from '../game/TSShelfSystem';
import { TSSaveSystem, TSShelfSlotData } from '../game/TSSaveSystem';
import { TSItemConfig, TSItemData } from '../../config/TSItemConfig';
const { ccclass, property } = _decorator;

/**
 * 货架面板
 * 打开时强制刷新，展示所有货架格的解锁 / 上架状态。
 */
@ccclass('TSUIShelf')
export class TSUIShelf extends Component {
    @property(Node)
    public slotRoot: Node = null!;

    @property(Prefab)
    public slotPrefab: Prefab = null!;

    protected onLoad(): void {
        this.RefreshUI();
    }

    public RefreshUI(): void {
        if (!this.slotRoot || !this.slotPrefab) return;
        this.slotRoot.removeAllChildren();
        TSSaveSystem.data.shelfSlots.forEach((slot: TSShelfSlotData) => {
            const node = instantiate(this.slotPrefab);
            this.slotRoot.addChild(node);
            const comp = node.getComponent(TSUIShelfSlot);
            if (comp) comp.SetData(slot);
        });
    }

    public OnClose(): void {
        if (this.node && this.node.isValid) this.node.destroy();
    }
}

/**
 * 单个货架格
 * 未解锁时展示解锁花费；已解锁时空货架可上架、已有商品可升级。
 */
@ccclass('TSUIShelfSlot')
export class TSUIShelfSlot extends Component {
    @property(Label)
    public txtInfo: Label = null!;

    @property(Label)
    public txtCost: Label = null!;

    private slotData: TSShelfSlotData | null = null;

    public SetData(data: TSShelfSlotData): void {
        this.slotData = data;
        if (data.unlocked) {
            const item = TSShelfSystem.GetItemById(data.itemId);
            if (this.txtInfo) this.txtInfo.string = item ? item.name : "空货架";
            const next = this.GetNextItem(data.itemId);
            if (this.txtCost) this.txtCost.string = next ? `升级 ${next.price} 金币` : "已满级";
        } else {
            const cost = TSShelfSystem.GetUnlockCost(data.slotId);
            if (this.txtInfo) this.txtInfo.string = "未解锁";
            if (this.txtCost) this.txtCost.string = `解锁 ${cost} 金币`;
        }
    }

    private GetNextItem(itemId: string): TSItemData | undefined {
        const index = TSShelfSystem.GetItemIndex(itemId) + 1;
        return TSItemConfig[index];
    }

    public OnClickSlot(): void {
        if (!this.slotData) return;

        let changed = false;
        if (!this.slotData.unlocked) {
            changed = TSShelfSystem.UnlockSlot(this.slotData.slotId);
            if (!changed) this.Toast("金币不足");
        } else {
            changed = TSShelfSystem.UpgradeSlot(this.slotData.slotId);
            if (!changed) this.Toast("金币不足或已满级");
        }
        if (changed) this.SetData(this.slotData);
    }

    private Toast(msg: string): void {
        if (typeof wx !== 'undefined' && wx.showToast) {
            wx.showToast({ title: msg, icon: 'none' });
        } else {
            console.log(`[TSUIShelfSlot] ${msg}`);
        }
    }
}
