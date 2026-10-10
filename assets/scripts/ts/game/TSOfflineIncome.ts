import { TSGameRoot } from "./TSGameRoot";
import { TSSaveSystem } from "./TSSaveSystem";
import { TSUIManager } from "../ui/TSUIManager";
import { CONFIG } from "../ProjectConst";

/**
 * 离线收益模块
 * 计算后台离线时长产出，上线时推送领取弹窗，支持广告双倍领取。
 */
export namespace TSOfflineIncome {
    let pendingReward = 0;

    /**
     * 结算离线收益
     * 结算后立即刷新退出时间戳，避免同一次离线被重复结算。
     */
    export function CalcOfflineReward(): void {
        const now = Date.now();
        const lastTime = TSSaveSystem.data.lastExitTimestamp || now;
        let diffSec = Math.floor((now - lastTime) / 1000);
        if (diffSec < 0) diffSec = 0;
        diffSec = Math.min(diffSec, CONFIG.MAX_OFFLINE_SEC);

        const reward = Math.floor(diffSec * CONFIG.OFFLINE_COIN_PER_SEC);

        TSSaveSystem.data.lastExitTimestamp = now;
        TSSaveSystem.MarkDirty();

        if (reward > 0) {
            pendingReward = reward;
            TSUIManager.ShowOfflinePopup(reward);
        }
    }

    export function GetPendingReward(): number {
        return pendingReward;
    }

    /**
     * 领取离线收益
     * @param multiplier 领取倍率（广告双倍时传 2）
     */
    export function ClaimReward(multiplier: number = 1): void {
        const total = Math.floor(pendingReward * multiplier);
        pendingReward = 0;
        if (total > 0 && TSGameRoot.instance) {
            TSGameRoot.instance.AddCoins(total);
        }
    }
}
