import { TSSaveSystem } from "./TSSaveSystem";
import { TSCustomerSystem } from "./TSCustomerSystem";
import { TSOfflineIncome } from "./TSOfflineIncome";
import { TSAlbumSystem } from "./TSAlbumSystem";
import { AD_UNIT_ID } from "../ProjectConst";

/** 广告业务类型 */
export enum TSAdType {
    /** 离线收益双倍 */
    OfflineDouble,
    /** 快速批量召唤顾客 */
    QuickCustomer,
    /** 解锁相册碎片 */
    UnlockAlbum,
}

/**
 * 广告 SDK 模块
 * 统一封装微信激励视频广告，透出广告类型分发与奖励回调。
 * 非微信环境（编辑器预览）下走调试模式直接发放奖励，方便本地联调。
 */
export namespace TSAdSystem {
    let rewardedAd: WechatMiniprogram.RewardedVideoAd | null = null;
    let currentAdType: TSAdType = TSAdType.OfflineDouble;
    let currentOnDone: ((success: boolean) => void) | null = null;
    let isLoading = false;

    export function Init(): void {
        if (typeof wx === "undefined" || typeof wx.createRewardedVideoAd !== "function") {
            console.warn("[TSAdSystem] 当前环境不支持激励视频广告，仅微信小游戏内生效");
            return;
        }

        rewardedAd = wx.createRewardedVideoAd({ adUnitId: AD_UNIT_ID });

        rewardedAd.onClose(res => {
            // 严格判断 isEnded，未完整观看不发放奖励
            const success = !!(res && res.isEnded);
            if (success) {
                TSSaveSystem.data.adTodayWatchCount++;
                TSSaveSystem.MarkDirty();
                OnAdReward(currentAdType);
            }
            const cb = currentOnDone;
            currentOnDone = null;
            if (cb) cb(success);
        });

        rewardedAd.onError(err => {
            // 广告异常统一捕获，避免加载失败导致游戏卡死
            console.error("[TSAdSystem] 广告加载失败：", err);
            const cb = currentOnDone;
            currentOnDone = null;
            if (cb) cb(false);
        });
    }

    /**
     * 展示激励广告
     * @param type 广告业务类型
     * @param onDone 观看结果回调（true=完整观看获得奖励，false=未完成/加载失败）
     */
    export function ShowAd(type: TSAdType, onDone?: (success: boolean) => void): void {
        currentAdType = type;
        currentOnDone = onDone || null;

        if (!rewardedAd) {
            // 编辑器预览：无广告实例时按调试模式直接发放奖励
            console.warn("[TSAdSystem] 无广告实例，调试模式直接发放奖励");
            TSSaveSystem.data.adTodayWatchCount++;
            TSSaveSystem.MarkDirty();
            OnAdReward(type);
            const cb = currentOnDone;
            currentOnDone = null;
            if (cb) cb(true);
            return;
        }

        rewardedAd.show().catch(() => {
            // 展示失败时重新拉取广告后再尝试一次
            loadAndShow();
        });
    }

    function loadAndShow(): void {
        if (!rewardedAd || isLoading) return;
        isLoading = true;
        rewardedAd.load()
            .then(() => {
                isLoading = false;
                return rewardedAd!.show();
            })
            .catch(err => {
                isLoading = false;
                console.error("[TSAdSystem] 广告展示失败：", err);
                const cb = currentOnDone;
                currentOnDone = null;
                if (cb) cb(false);
            });
    }

    /** 广告奖励分发 */
    function OnAdReward(type: TSAdType): void {
        switch (type) {
            case TSAdType.QuickCustomer:
                if (TSCustomerSystem.instance) TSCustomerSystem.instance.SpawnBatch();
                break;
            case TSAdType.OfflineDouble:
                TSOfflineIncome.ClaimReward(2);
                break;
            case TSAdType.UnlockAlbum:
                TSAlbumSystem.ClaimPendingFragment();
                break;
        }
    }
}
