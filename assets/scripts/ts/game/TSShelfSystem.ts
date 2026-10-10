import { TSSaveSystem, TSShelfSlotData } from "./TSSaveSystem";
import { TSGameRoot } from "./TSGameRoot";
import { TSEvent, TSEventType } from "../TSEvent";
import { CONFIG } from "../ProjectConst";
import { TSItemConfig, TSItemData } from "../../config/TSItemConfig";

/**
 * 货架经营模块
 * 负责货架格解锁、商品上架/升级、经营收益统计。
 */
export namespace TSShelfSystem {
    /** 各货架格解锁消耗金币（索引对应 slotId） */
    export const UNLOCK_COSTS = [0, 100, 200, 400, 800, 1500];

    /** 初始化货架格，首次进入游戏默认解锁第一个格子 */
    export function Init(): void {
        if (!Array.isArray(TSSaveSystem.data.shelfSlots) || TSSaveSystem.data.shelfSlots.length === 0) {
            const slots: TSShelfSlotData[] = [];
            for (let i = 0; i < CONFIG.SHELF_SLOT_COUNT; i++) {
                slots.push({ slotId: i, unlocked: i === 0, itemId: "" });
            }
            TSSaveSystem.data.shelfSlots = slots;
            TSSaveSystem.MarkDirty();
        }
    }

    export function GetSlot(slotId: number): TSShelfSlotData | undefined {
        return TSSaveSystem.data.shelfSlots.find(v => v.slotId === slotId);
    }

    export function GetUnlockCost(slotId: number): number {
        return UNLOCK_COSTS[slotId] !== undefined ? UNLOCK_COSTS[slotId] : UNLOCK_COSTS[UNLOCK_COSTS.length - 1];
    }

    /** 解锁货架格 */
    export function UnlockSlot(slotId: number): boolean {
        const slot = GetSlot(slotId);
        if (!slot || slot.unlocked) return false;

        const cost = GetUnlockCost(slotId);
        if (TSGameRoot.instance.coins < cost) return false;

        TSGameRoot.instance.AddCoins(-cost);
        slot.unlocked = true;
        TSSaveSystem.MarkDirty();
        TSEvent.emit(TSEventType.SHELF_CHANGED);
        return true;
    }

    /** 上架 / 升级货架商品：按商品配置顺序解锁下一档 */
    export function UpgradeSlot(slotId: number): boolean {
        const slot = GetSlot(slotId);
        if (!slot || !slot.unlocked) return false;

        const nextIndex = GetItemIndex(slot.itemId) + 1;
        if (nextIndex >= TSItemConfig.length) return false;

        const nextItem = TSItemConfig[nextIndex];
        if (TSGameRoot.instance.coins < nextItem.price) return false;

        TSGameRoot.instance.AddCoins(-nextItem.price);
        PutItem(slotId, nextItem.id);
        return true;
    }

    /** 在指定货架格上架商品 */
    export function PutItem(slotId: number, itemId: string): void {
        const slot = GetSlot(slotId);
        if (slot && slot.unlocked) {
            slot.itemId = itemId;
            TSSaveSystem.MarkDirty();
            TSEvent.emit(TSEventType.SHELF_CHANGED);
        }
    }

    export function GetItemIndex(itemId: string): number {
        return TSItemConfig.findIndex(v => v.id === itemId);
    }

    export function GetItemById(itemId: string): TSItemData | undefined {
        return TSItemConfig.find(v => v.id === itemId);
    }

    /** 当前所有已上架商品带来的额外经营收益总和 */
    export function GetTotalRevenue(): number {
        let total = 0;
        for (const slot of TSSaveSystem.data.shelfSlots) {
            if (!slot.unlocked || !slot.itemId) continue;
            const item = GetItemById(slot.itemId);
            if (item) total += item.addRevenue;
        }
        return total;
    }
}
