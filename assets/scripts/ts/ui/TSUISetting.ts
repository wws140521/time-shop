import { _decorator, Component, Slider, Toggle } from 'cc';
import { TSSaveSystem } from '../game/TSSaveSystem';
import { TSGameRoot } from '../game/TSGameRoot';
import { TSEvent, TSEventType } from '../TSEvent';
const { ccclass, property } = _decorator;

/**
 * 设置面板
 * 音量调节、滤镜开关、清除存档、隐私政策入口。
 */
@ccclass('TSUISetting')
export class TSUISetting extends Component {
    @property(Slider)
    public sliderBGM: Slider = null!;

    @property(Slider)
    public sliderSfx: Slider = null!;

    @property(Toggle)
    public toggleFilter: Toggle = null!;

    protected onLoad(): void {
        const set = TSSaveSystem.data.setting;
        if (this.sliderBGM) this.sliderBGM.progress = set.bgmVolume;
        if (this.sliderSfx) this.sliderSfx.progress = set.sfxVolume;
        if (this.toggleFilter) this.toggleFilter.isChecked = set.filmFilter;
    }

    public OnBGMChange(slider: Slider): void {
        TSSaveSystem.data.setting.bgmVolume = slider.progress;
        TSSaveSystem.MarkDirty();
        TSEvent.emit(TSEventType.SETTING_CHANGED);
    }

    public OnSfxChange(slider: Slider): void {
        TSSaveSystem.data.setting.sfxVolume = slider.progress;
        TSSaveSystem.MarkDirty();
        TSEvent.emit(TSEventType.SETTING_CHANGED);
    }

    public OnFilterToggle(toggle: Toggle): void {
        TSSaveSystem.data.setting.filmFilter = toggle.isChecked;
        TSSaveSystem.MarkDirty();
        TSEvent.emit(TSEventType.SETTING_CHANGED);
    }

    /** 清除本地存档 */
    public OnClearSave(): void {
        const doClear = () => {
            TSSaveSystem.ClearSave();
            // 同步重置运行时数据，重新初始化各业务模块
            if (TSGameRoot.instance) TSGameRoot.instance.InitGame();
            if (typeof wx !== 'undefined' && wx.showToast) {
                wx.showToast({ title: "存档已清空", icon: 'none' });
            }
            this.OnClose();
        };

        if (typeof wx !== 'undefined' && wx.showModal) {
            wx.showModal({
                title: "确认清除存档？",
                content: "全部游戏进度将被删除，无法恢复！",
                success(res) {
                    if (res.confirm) doClear();
                }
            });
        } else {
            // 编辑器预览环境降级使用浏览器确认框
            if (confirm("确认清除存档？全部游戏进度将被删除，无法恢复！")) doClear();
        }
    }

    /** 打开隐私政策页面 */
    public OnOpenPrivacy(): void {
        if (typeof wx !== 'undefined' && wx.navigateTo) {
            wx.navigateTo({ url: "/privacy.html" });
        } else {
            console.log("[TSUISetting] 当前环境暂不支持打开隐私政策页面");
        }
    }

    public OnClose(): void {
        if (this.node && this.node.isValid) this.node.destroy();
    }
}
