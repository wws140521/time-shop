import { _decorator, Component, Label, Node } from 'cc';
import { TSAlbumSystem } from '../game/TSAlbumSystem';
import { TSAdSystem, TSAdType } from '../game/TSAdSystem';
import { TSAudioManager } from '../game/TSAudioManager';
import { TSAlbumData } from '../../config/TSAlbumConfig';
const { ccclass, property } = _decorator;

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
            if (!success) {
                TSAlbumSystem.SetPendingFragment("");
                return;
            }
            TSAudioManager.PlayUnlock();
        });
    }
}
