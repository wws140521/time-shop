import { Node, instantiate } from 'cc';
import { TSUIOfflineReward } from './TSUIOfflineReward';
import { TSUIShelf } from './TSUIShelf';
import { TSUIAlbum } from './TSUIAlbum';

/** UI 管理器配置，由 TSGameRoot 在入口注入编辑器挂载的节点模板 */
export interface TSUIConfig {
    uiRoot: Node;
    offlinePopup: Node;
    shelfPanel: Node;
    albumPanel: Node;
    settingPanel: Node;
}

/**
 * UI 总管理器
 * 所有弹窗统一创建 / 销毁 / 管理，业务层仅调用静态方法，与 UI 完全解耦。
 * 同一面板做单例复用，避免重复创建导致节点叠加。
 */
export class TSUIManager {
    public static instance: TSUIManager = null!;

    private cfg: TSUIConfig | null = null;
    private openPanels: Map<string, Node> = new Map();

    public static Init(cfg: TSUIConfig): void {
        if (!TSUIManager.instance) TSUIManager.instance = new TSUIManager();
        TSUIManager.instance.cfg = cfg;
    }

    /** 创建或复用面板节点（模板来自场景中的隐藏模板节点） */
    private openPanel(key: string, template: Node | undefined): Node | null {
        if (!this.cfg || !this.cfg.uiRoot) {
            console.error("[TSUIManager] UI 未初始化，请检查 TSGameRoot 是否已注入配置");
            return null;
        }

        const exist = this.openPanels.get(key);
        if (exist && exist.isValid) {
            exist.active = true;
            return exist;
        }

        if (!template) {
            console.error(`[TSUIManager] 面板模板未配置：${key}`);
            return null;
        }

        const node = instantiate(template);
        node.active = true;
        this.cfg.uiRoot.addChild(node);
        this.openPanels.set(key, node);
        // 面板销毁后清理缓存，保证下次打开重新创建
        node.once(Node.EventType.NODE_DESTROYED, () => {
            if (this.openPanels.get(key) === node) this.openPanels.delete(key);
        });
        return node;
    }

    /** 展示离线收益弹窗 */
    public static ShowOfflinePopup(baseReward: number): void {
        const inst = TSUIManager.instance;
        if (!inst) return;
        const node = inst.openPanel("offline", inst.cfg?.offlinePopup);
        const popup = node ? node.getComponent(TSUIOfflineReward) : null;
        if (popup) popup.SetData(baseReward);
    }

    /** 展示货架面板 */
    public static ShowShelfPanel(): void {
        const inst = TSUIManager.instance;
        if (!inst) return;
        const node = inst.openPanel("shelf", inst.cfg?.shelfPanel);
        const panel = node ? node.getComponent(TSUIShelf) : null;
        if (panel) panel.RefreshUI();
    }

    /** 展示相册面板 */
    public static ShowAlbumPanel(): void {
        const inst = TSUIManager.instance;
        if (!inst) return;
        const node = inst.openPanel("album", inst.cfg?.albumPanel);
        const panel = node ? node.getComponent(TSUIAlbum) : null;
        if (panel) panel.Refresh();
    }

    /** 展示设置面板 */
    public static ShowSettingPanel(): void {
        const inst = TSUIManager.instance;
        if (!inst) return;
        inst.openPanel("setting", inst.cfg?.settingPanel);
    }
}
