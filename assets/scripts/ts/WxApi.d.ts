/**
 * 微信小游戏 API 类型声明
 * 仅声明本项目实际使用到的接口，避免引入额外类型依赖。
 * 非微信环境（编辑器预览）下 wx 为 undefined，使用前需用 typeof wx !== "undefined" 判断。
 */

declare namespace WechatMiniprogram {
    interface RewardedVideoAd {
        load(): Promise<void>;
        show(): Promise<void>;
        onLoad(callback: () => void): void;
        offLoad(callback?: () => void): void;
        onError(callback: (err: { errCode?: number; errMsg: string }) => void): void;
        offError(callback?: (err: any) => void): void;
        onClose(callback: (res?: { isEnded: boolean; errMsg?: string }) => void): void;
        offClose(callback?: (res?: any) => void): void;
    }

    interface ShowModalResult {
        confirm: boolean;
        cancel: boolean;
    }
}

declare const wx: {
    /** 读取本地缓存 */
    getStorageSync(key: string): any;
    /** 写入本地缓存 */
    setStorageSync(key: string, value: any): void;
    /** 删除本地缓存 */
    removeStorageSync(key: string): void;
    /** 小程序切入前台 */
    onShow(callback: () => void): void;
    /** 小程序切入后台 */
    onHide(callback: () => void): void;
    /** 创建激励视频广告实例 */
    createRewardedVideoAd(option: { adUnitId: string; multiton?: boolean }): WechatMiniprogram.RewardedVideoAd;
    /** 轻提示 */
    showToast(option: { title: string; icon?: string; duration?: number }): void;
    /** 模态弹窗 */
    showModal(option: {
        title?: string;
        content?: string;
        showCancel?: boolean;
        success?: (res: WechatMiniprogram.ShowModalResult) => void;
        fail?: (err: any) => void;
    }): void;
    /** 页面跳转 */
    navigateTo(option: { url: string; success?: () => void; fail?: (err: any) => void }): void;
};
