import { _decorator, Component } from 'cc';
import { TSGameRoot } from './TSGameRoot';
import { TSShelfSystem } from './TSShelfSystem';
import { CONFIG } from '../ProjectConst';
const { ccclass, property } = _decorator;

/**
 * 单个顾客
 * 进店停留后消费，产出金币（基础收益 + 货架经营加成）后离店销毁。
 */
@ccclass('TSCustomer')
export class TSCustomer extends Component {
    @property
    public baseGain: number = CONFIG.CUSTOMER_BASE_GAIN;

    /** 顾客在店内停留时长（秒） */
    @property
    public stayDuration: number = 3;

    public Init(): void {
        this.ShopLogic();
    }

    private ShopLogic(): void {
        this.scheduleOnce(() => {
            const gain = this.baseGain + TSShelfSystem.GetTotalRevenue();
            if (TSGameRoot.instance) TSGameRoot.instance.AddCoins(gain);
            if (this.node && this.node.isValid) this.node.destroy();
        }, this.stayDuration);
    }
}
