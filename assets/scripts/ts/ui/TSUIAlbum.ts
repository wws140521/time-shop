import { _decorator, Component, Node, instantiate } from 'cc';
import { TSAlbumSystem } from '../game/TSAlbumSystem';
import { TSEvent, TSEventType } from '../TSEvent';
import { TSAlbumConfig, TSAlbumData } from '../../config/TSAlbumConfig';
import { TSUIAlbumItem } from './TSUIAlbumItem';
const { ccclass, property } = _decorator;

/**
 * 相册面板
 * 打开时强制刷新；广告解锁碎片后监听事件自动刷新列表。
 */
@ccclass('TSUIAlbum')
export class TSUIAlbum extends Component {
    @property(Node)
    public itemRoot: Node = null!;

    @property(Node)
    public albumItemTemplate: Node = null!;

    protected onLoad(): void {
        this.Refresh();
        TSEvent.on(TSEventType.ALBUM_CHANGED, this.Refresh, this);
    }

    protected onDestroy(): void {
        TSEvent.off(TSEventType.ALBUM_CHANGED, this.Refresh, this);
    }

    public Refresh(): void {
        if (!this.itemRoot || !this.albumItemTemplate) return;
        this.itemRoot.removeAllChildren();
        TSAlbumConfig.forEach((cfg: TSAlbumData) => {
            const node = instantiate(this.albumItemTemplate);
            node.active = true;
            this.itemRoot.addChild(node);
            const comp = node.getComponent(TSUIAlbumItem);
            if (comp) comp.SetData(cfg, TSAlbumSystem.IsUnlocked(cfg.id));
        });
    }

    public OnClose(): void {
        if (this.node && this.node.isValid) this.node.destroy();
    }
}
