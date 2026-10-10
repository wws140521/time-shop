import { _decorator, Component, Node } from 'cc';
import { TSSaveSystem } from '../game/TSSaveSystem';
import { TSEvent, TSEventType } from '../TSEvent';
const { ccclass, property } = _decorator;

/**
 * 复古滤镜控制
 * 通过一个全屏「胶片滤镜」覆盖层模拟怀旧画面效果，开关状态持久化到存档。
 * 覆盖层为可选的半透明暖色 / 噪点图层，需在编辑器中作为 UI 顶层节点挂载。
 */
@ccclass('TSFilterController')
export class TSFilterController extends Component {
    /** 全屏滤镜覆盖层节点 */
    @property(Node)
    public filterOverlay: Node = null!;

    protected onLoad(): void {
        TSEvent.on(TSEventType.SETTING_CHANGED, this.Apply, this);
        this.Apply();
    }

    protected onDestroy(): void {
        TSEvent.off(TSEventType.SETTING_CHANGED, this.Apply, this);
    }

    /** 根据存档中的滤镜开关显示 / 隐藏覆盖层 */
    public Apply(): void {
        if (!this.filterOverlay) return;
        this.filterOverlay.active = TSSaveSystem.data.setting.filmFilter;
    }
}
