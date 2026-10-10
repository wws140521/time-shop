import { _decorator, Component, Label } from 'cc';
import { TSAdSystem, TSAdType } from '../game/TSAdSystem';
import { TSOfflineIncome } from '../game/TSOfflineIncome';
const { ccclass, property } = _decorator;

/**
 * 离线收益弹窗
 * 展示基础收益，支持直接领取或看广告双倍领取。
 */
@ccclass('TSUIOfflineReward')
export class TSUIOfflineReward extends Component {
    @property(Label)
    public txtBaseReward: Label = null!;

    @property(Label)
    public txtDoubleReward: Label = null!;

    public SetData(reward: number): void {
        if (this.txtBaseReward) this.txtBaseReward.string = `离线收益：${reward} 金币`;
        if (this.txtDoubleReward) this.txtDoubleReward.string = `看广告领取：${reward * 2} 金币`;
    }

    /** 直接领取基础收益 */
    public OnClaimBase(): void {
        TSOfflineIncome.ClaimReward(1);
        this.OnClose();
    }

    /** 看广告双倍领取 */
    public OnWatchAdDouble(): void {
        TSAdSystem.ShowAd(TSAdType.OfflineDouble, (success) => {
            // 广告未完整观看时，至少发放基础收益，避免玩家损失
            if (!success) TSOfflineIncome.ClaimReward(1);
        });
        this.OnClose();
    }

    public OnClose(): void {
        if (this.node && this.node.isValid) this.node.destroy();
    }
}
