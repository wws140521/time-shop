import { _decorator, Component, AudioSource, AudioClip } from 'cc';
import { TSSaveSystem } from './TSSaveSystem';
import { TSEvent, TSEventType } from '../TSEvent';
const { ccclass, property } = _decorator;

/**
 * 音频管理模块
 * 统一管理 BGM 与音效播放，音量实时读取设置存档；
 * 设置面板修改音量后会派发 SETTING_CHANGED，本模块自动同步。
 */
@ccclass('TSAudioManager')
export class TSAudioManager extends Component {
    public static instance: TSAudioManager = null!;

    @property(AudioSource)
    public bgmSource: AudioSource = null!;

    @property(AudioSource)
    public sfxSource: AudioSource = null!;

    /** 默认背景音乐，进入游戏时自动循环播放 */
    @property(AudioClip)
    public defaultBgm: AudioClip = null!;

    /** 通用点击音效 */
    @property(AudioClip)
    public sfxClick: AudioClip = null!;

    /** 金币收益音效 */
    @property(AudioClip)
    public sfxCoin: AudioClip = null!;

    /** 解锁 / 升级成功音效 */
    @property(AudioClip)
    public sfxUnlock: AudioClip = null!;

    protected onLoad(): void {
        TSAudioManager.instance = this;
        TSEvent.on(TSEventType.SETTING_CHANGED, this.ApplyVolumes, this);
        this.ApplyVolumes();
        if (this.defaultBgm) this.PlayBGM(this.defaultBgm);
    }

    protected onDestroy(): void {
        TSEvent.off(TSEventType.SETTING_CHANGED, this.ApplyVolumes, this);
        if (TSAudioManager.instance === this) TSAudioManager.instance = null!;
    }

    /** 将存档中的音量应用到音频源 */
    public ApplyVolumes(): void {
        const set = TSSaveSystem.data.setting;
        if (this.bgmSource) this.bgmSource.volume = set.bgmVolume;
        if (this.sfxSource) this.sfxSource.volume = set.sfxVolume;
    }

    /** 播放背景音乐，未传参时使用默认 BGM */
    public PlayBGM(clip?: AudioClip): void {
        if (!this.bgmSource) return;
        const target = clip || this.defaultBgm;
        if (!target) return;
        this.bgmSource.stop();
        this.bgmSource.clip = target;
        this.bgmSource.loop = true;
        this.bgmSource.volume = TSSaveSystem.data.setting.bgmVolume;
        this.bgmSource.play();
    }

    public StopBGM(): void {
        if (this.bgmSource) this.bgmSource.stop();
    }

    public PauseBGM(): void {
        if (this.bgmSource) this.bgmSource.pause();
    }

    public ResumeBGM(): void {
        if (this.bgmSource) this.bgmSource.play();
    }

    /** 播放一次音效（音量由 AudioSource 控制） */
    public PlaySFX(clip: AudioClip | null): void {
        if (!clip || !this.sfxSource) return;
        this.sfxSource.playOneShot(clip);
    }

    // ---------- 静态便捷方法，供业务层 / UI 直接调用 ----------

    public static PlayClick(): void {
        const inst = TSAudioManager.instance;
        if (inst) inst.PlaySFX(inst.sfxClick);
    }

    public static PlayCoin(): void {
        const inst = TSAudioManager.instance;
        if (inst) inst.PlaySFX(inst.sfxCoin);
    }

    public static PlayUnlock(): void {
        const inst = TSAudioManager.instance;
        if (inst) inst.PlaySFX(inst.sfxUnlock);
    }

    public static PlayBgm(clip?: AudioClip): void {
        if (TSAudioManager.instance) TSAudioManager.instance.PlayBGM(clip);
    }

    public static StopBgm(): void {
        if (TSAudioManager.instance) TSAudioManager.instance.StopBGM();
    }
}
