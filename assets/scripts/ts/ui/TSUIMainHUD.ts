import { _decorator, Component, Label, Node } from 'cc';
import { TSGameRoot } from '../game/TSGameRoot';
import { TSSaveSystem } from '../game/TSSaveSystem';
import { TSAlbumSystem } from '../game/TSAlbumSystem';
import { TSAdSystem, TSAdType } from '../game/TSAdSystem';
import { TSAudioManager } from '../game/TSAudioManager';
import { TSUIManager } from './TSUIManager';
import { TSEvent, TSEventType } from '../TSEvent';
import { TSAlbumConfig } from '../../config/TSAlbumConfig';
const { ccclass, property } = _decorator;

/**
 * 主场景 HUD
 * 展示金币、回忆进度，并提供货架 / 相册 / 设置 / 召唤顾客等入口。
 * 数据通过 TSEvent 监听自动刷新，不与业务层直接耦合。
 */
@ccclass('TSUIMainHUD')
export class TSUIMainHUD extends Component {
    @property(Label)
    public txtCoins: Label = null!;

    @property(Label)
    public txtAlbumProgress: Label = null!;

    @property(Node)
    public btnQuickCustomer: Node = null!;

    /** 召唤顾客广告冷却时长（秒） */
    private readonly quickCustomerCD = 30;

    protected onLoad(): void {
        TSEvent.on(TSEventType.COINS_CHANGED, this.RefreshCoins, this);
        TSEvent.on(TSEventType.ALBUM_CHANGED, this.RefreshAlbum, this);
        this.RefreshAll();
    }

    protected onDestroy(): void {
        TSEvent.off(TSEventType.COINS_CHANGED, this.RefreshCoins, this);
        TSEvent.off(TSEventType.ALBUM_CHANGED, this.RefreshAlbum, this);
    }

    public RefreshAll(): void {
        this.RefreshCoins();
        this.RefreshAlbum();
    }

    /** 刷新金币显示 */
    public RefreshCoins(coins?: number): void {
        if (!this.txtCoins) return;
        let value = coins;
        if (typeof value !== "number") {
            value = TSGameRoot.instance ? TSGameRoot.instance.coins : TSSaveSystem.data.coins;
        }
        this.txtCoins.string = this.FormatNumber(value);
    }

    /** 刷新回忆收集进度 */
    public RefreshAlbum(): void {
        if (!this.txtAlbumProgress) return;
        this.txtAlbumProgress.string = `回忆 ${TSAlbumSystem.GetUnlockedCount()}/${TSAlbumConfig.length}`;
    }

    /** 打开货架面板 */
    public OnClickShelf(): void {
        TSAudioManager.PlayClick();
        TSUIManager.ShowShelfPanel();
    }

    /** 打开相册面板 */
    public OnClickAlbum(): void {
        TSAudioManager.PlayClick();
        TSUIManager.ShowAlbumPanel();
    }

    /** 打开设置面板 */
    public OnClickSetting(): void {
        TSAudioManager.PlayClick();
        TSUIManager.ShowSettingPanel();
    }

    /** 看广告快速召唤顾客（带冷却，避免频繁点击） */
    public OnClickQuickCustomer(): void {
        const now = Date.now();
        if (now < TSSaveSystem.data.quickSpawnCustomerCD) {
            const left = Math.ceil((TSSaveSystem.data.quickSpawnCustomerCD - now) / 1000);
            this.Toast(`冷却中，${left} 秒后可再次召唤`);
            return;
        }

        TSAdSystem.ShowAd(TSAdType.QuickCustomer, (success) => {
            if (!success) {
                this.Toast("广告未看完，召唤失败");
                return;
            }
            TSSaveSystem.data.quickSpawnCustomerCD = Date.now() + this.quickCustomerCD * 1000;
            TSSaveSystem.MarkDirty();
            TSAudioManager.PlayClick();
            this.Toast("顾客正在赶来~");
        });
    }

    /** 大数值格式化：万 / 亿 */
    private FormatNumber(value: number): string {
        if (value >= 100000000) return (value / 100000000).toFixed(2) + "亿";
        if (value >= 10000) return (value / 10000).toFixed(2) + "万";
        return Math.floor(value).toString();
    }

    private Toast(msg: string): void {
        if (typeof wx !== 'undefined' && wx.showToast) {
            wx.showToast({ title: msg, icon: 'none' });
        } else {
            console.log(`[TSUIMainHUD] ${msg}`);
        }
    }
}
