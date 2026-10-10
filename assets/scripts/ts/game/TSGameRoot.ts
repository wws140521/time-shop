import { _decorator, Component, Node, Prefab } from 'cc';
import { TSSaveSystem } from './TSSaveSystem';
import { TSOfflineIncome } from './TSOfflineIncome';
import { TSCustomerSystem } from './TSCustomerSystem';
import { TSAdSystem } from './TSAdSystem';
import { TSShelfSystem } from './TSShelfSystem';
import { TSAlbumSystem } from './TSAlbumSystem';
import { TSUIManager } from '../ui/TSUIManager';
import { TSEvent, TSEventType } from '../TSEvent';
const { ccclass, property } = _decorator;

/**
 * 游戏入口
 * 统一初始化所有模块、全局数据管理与小程序前后台监听。
 */
@ccclass('TSGameRoot')
export class TSGameRoot extends Component {
    public static instance: TSGameRoot = null!;

    @property(Node)
    public uiRoot: Node = null!;

    @property(Prefab)
    public offlinePopupPrefab: Prefab = null!;

    @property(Prefab)
    public shelfPanelPrefab: Prefab = null!;

    @property(Prefab)
    public albumPanelPrefab: Prefab = null!;

    @property(Prefab)
    public settingPanelPrefab: Prefab = null!;

    @property(TSCustomerSystem)
    public customerSystem: TSCustomerSystem = null!;

    public coins: number = 0;

    protected onLoad(): void {
        TSGameRoot.instance = this;
        this.InitGame();
        this.RegisterWxLifecycle();
    }

    protected onDestroy(): void {
        if (TSGameRoot.instance === this) {
            TSGameRoot.instance = null!;
        }
    }

    /** 初始化游戏：加载存档、初始化各业务模块、结算离线收益 */
    public InitGame(): void {
        TSSaveSystem.Load();
        this.coins = TSSaveSystem.data.coins;

        TSShelfSystem.Init();
        TSAlbumSystem.Init();
        TSAdSystem.Init();
        TSUIManager.Init({
            uiRoot: this.uiRoot,
            offlinePopup: this.offlinePopupPrefab,
            shelfPanel: this.shelfPanelPrefab,
            albumPanel: this.albumPanelPrefab,
            settingPanel: this.settingPanelPrefab,
        });

        // 使用上次退出时间结算离线收益，随后刷新退出时间戳
        TSOfflineIncome.CalcOfflineReward();
        TSSaveSystem.data.lastExitTimestamp = Date.now();
        TSSaveSystem.MarkDirty();
        TSEvent.emit(TSEventType.COINS_CHANGED, this.coins);
    }

    /** 小程序前后台生命周期监听 */
    private RegisterWxLifecycle(): void {
        if (typeof wx === 'undefined') return;

        wx.onShow(() => {
            // 从后台返回前台，结算离线收益
            TSOfflineIncome.CalcOfflineReward();
        });

        wx.onHide(() => {
            // 切到后台，记录退出时间并立即存档
            TSSaveSystem.data.lastExitTimestamp = Date.now();
            TSSaveSystem.MarkDirty();
            TSSaveSystem.Save();
        });
    }

    /** 增加 / 扣除金币，负数表示扣除 */
    public AddCoins(amount: number): void {
        if (!amount) return;
        this.coins += amount;
        if (this.coins < 0) this.coins = 0;
        TSSaveSystem.data.coins = this.coins;
        TSSaveSystem.MarkDirty();
        TSEvent.emit(TSEventType.COINS_CHANGED, this.coins);
    }
}
