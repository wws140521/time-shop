import { _decorator, Component, Node, Label, Prefab, instantiate } from 'cc';
import { TSAlbumSystem } from '../game/TSAlbumSystem';
import { TSAdSystem, TSAdType } from '../game/TSAdSystem';
import { TSEvent, TSEventType } from '../TSEvent';
import { TSAlbumConfig, TSAlbumData } from '../../config/TSAlbumConfig';
const { ccclass, property } = _decorator;

/**
 * 相册面板
 * 打开时强制刷新；广告解锁碎片后监听事件自动刷新列表。
 */
@ccclass('TSUIAlbum')
export class TSUIAlbum extends Component {
    @property(Node)
    public itemRoot: Node = null!;

    @property(Prefab)
    public albumItemPrefab: Prefab = null!;

    protected onLoad(): void {
        this.Refresh();
        TSEvent.on(TSEventType.ALBUM_CHANGED, this.Refresh, this);
    }

    protected onDestroy(): void {
        TSEvent.off(TSEventType.ALBUM_CHANGED, this.Refresh, this);
    }

    public Refresh(): void {
        if (!this.itemRoot || !this.albumItemPrefab) return;
        this.itemRoot.removeAllChildren();
        TSAlbumConfig.forEach((cfg: TSAlbumData) => {
            const node = instantiate(this.albumItemPrefab);
            this.itemRoot.addChild(node);
            const comp = node.getComponent(TSUIAlbumItem);
            if (comp) comp.SetData(cfg, TSAlbumSystem.IsUnlocked(cfg.id));
        });
    }

    public OnClose(): void {
        if (this.node && this.node.isValid) this.node.destroy();
    }
}

/**
 * 单个相册条目
 * 已解锁展示标题与回忆文案，未解锁展示广告解锁按钮。
 */
@ccclass('TSUIAlbumItem')
export class TSUIAlbumItem extends Component {
    @property(Label)
    public txtTitle: Label = null!;

    @property(Label)
    public txtDesc: Label = null!;

    @property(Node)
    public btnUnlock: Node = null!;

    private cfg: TSAlbumData | null = null;

    public SetData(cfg: TSAlbumData, isUnlock: boolean): void {
        this.cfg = cfg;
        if (isUnlock) {
            if (this.txtTitle) this.txtTitle.string = cfg.title;
            if (this.txtDesc) this.txtDesc.string = cfg.desc;
            if (this.btnUnlock) this.btnUnlock.active = false;
        } else {
            if (this.txtTitle) this.txtTitle.string = "??? 未解锁";
            if (this.txtDesc) this.txtDesc.string = "观看广告解锁这段回忆";
            if (this.btnUnlock) this.btnUnlock.active = true;
        }
    }

    /** 看广告解锁当前碎片 */
    public OnWatchAdUnlock(): void {
        if (!this.cfg) return;
        TSAlbumSystem.SetPendingFragment(this.cfg.id);
        TSAdSystem.ShowAd(TSAdType.UnlockAlbum, (success) => {
            // 广告未完成时取消待领取碎片，避免误发放
            if (!success) TSAlbumSystem.SetPendingFragment("");
        });
    }
}
