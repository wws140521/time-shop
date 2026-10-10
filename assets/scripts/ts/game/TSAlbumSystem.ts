import { TSSaveSystem } from "./TSSaveSystem";
import { TSEvent, TSEventType } from "../TSEvent";
import { TSAlbumConfig, TSAlbumData } from "../../config/TSAlbumConfig";

/**
 * 相册收集模块
 * 负责回忆碎片的解锁、进度存档，以及广告解锁时的待领取碎片记录。
 */
export namespace TSAlbumSystem {
    let pendingFragmentId = "";

    export function Init(): void {
        // 相册进度直接托管于 TSSaveSystem，无需额外初始化
    }

    export function IsUnlocked(fragmentId: string): boolean {
        return TSSaveSystem.data.albumUnlocked.indexOf(fragmentId) >= 0;
    }

    /** 解锁 / 收集一个回忆碎片 */
    export function AddFragment(fragmentId: string): void {
        if (!fragmentId) return;
        const list = TSSaveSystem.data.albumUnlocked;
        if (list.indexOf(fragmentId) < 0) list.push(fragmentId);
        TSSaveSystem.data.memoryFragments[fragmentId] = (TSSaveSystem.data.memoryFragments[fragmentId] || 0) + 1;
        TSSaveSystem.MarkDirty();
        TSEvent.emit(TSEventType.ALBUM_CHANGED);
    }

    export function GetConfig(fragmentId: string): TSAlbumData | undefined {
        return TSAlbumConfig.find(v => v.id === fragmentId);
    }

    /** 已解锁碎片数量 */
    export function GetUnlockedCount(): number {
        return TSSaveSystem.data.albumUnlocked.length;
    }

    /** 记录当前正在通过广告解锁的碎片（广告奖励回调时使用） */
    export function SetPendingFragment(fragmentId: string): void {
        pendingFragmentId = fragmentId;
    }

    export function GetPendingFragment(): string {
        return pendingFragmentId;
    }

    /** 广告观看完成后，领取待解锁碎片 */
    export function ClaimPendingFragment(): void {
        if (!pendingFragmentId) return;
        const id = pendingFragmentId;
        pendingFragmentId = "";
        AddFragment(id);
    }
}
