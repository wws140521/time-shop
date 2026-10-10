import { CONFIG, SAVE_KEY, SAVE_VERSION } from "../ProjectConst";

/** 货架格子存档数据 */
export interface TSShelfSlotData {
    slotId: number;
    unlocked: boolean;
    itemId: string;
}

/** 设置项存档数据 */
export interface TSSettingData {
    bgmVolume: number;
    sfxVolume: number;
    filmFilter: boolean;
}

/** 全局游戏存档数据结构 */
export class TSGameData {
    version: number = SAVE_VERSION;
    coins: number = CONFIG.INIT_COINS;
    lastExitTimestamp: number = Date.now();
    adTodayWatchCount: number = 0;
    quickSpawnCustomerCD: number = 0;
    setting: TSSettingData = { bgmVolume: 0.7, sfxVolume: 0.7, filmFilter: true };
    tutorialFinished: boolean = false;
    shelfSlots: TSShelfSlotData[] = [];
    memoryFragments: Record<string, number> = {};
    albumUnlocked: string[] = [];
}

function defaultSetting(): TSSettingData {
    return { bgmVolume: 0.7, sfxVolume: 0.7, filmFilter: true };
}

/**
 * 全局存档系统
 * 所有游戏数据统一托管于此，业务模块调用 MarkDirty 标记更新，异步合并存档，避免频繁读写。
 */
export namespace TSSaveSystem {
    export let data: TSGameData = new TSGameData();

    let isDirty = false;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    /** 当前是否具备微信本地缓存能力 */
    function hasWxStorage(): boolean {
        return typeof wx !== "undefined" && typeof wx.getStorageSync === "function";
    }

    function readRaw(): any {
        try {
            if (hasWxStorage()) return wx.getStorageSync(SAVE_KEY);
            // 编辑器预览环境降级使用 localStorage，便于本地调试
            const ls = (globalThis as any).localStorage;
            if (ls) return ls.getItem(SAVE_KEY);
        } catch (e) {
            console.error("[TSSaveSystem] 读取存档失败", e);
        }
        return null;
    }

    function writeRaw(value: string): void {
        try {
            if (hasWxStorage()) {
                wx.setStorageSync(SAVE_KEY, value);
                return;
            }
            const ls = (globalThis as any).localStorage;
            if (ls) ls.setItem(SAVE_KEY, value);
        } catch (e) {
            console.error("[TSSaveSystem] 写入存档失败", e);
        }
    }

    function removeRaw(): void {
        try {
            if (hasWxStorage()) {
                wx.removeStorageSync(SAVE_KEY);
                return;
            }
            const ls = (globalThis as any).localStorage;
            if (ls) ls.removeItem(SAVE_KEY);
        } catch (e) {
            console.error("[TSSaveSystem] 删除存档失败", e);
        }
    }

    /** 加载存档，自动补齐缺失字段，异常时重置为默认存档 */
    export function Load(): void {
        const fresh = new TSGameData();
        const raw = readRaw();
        if (raw === null || raw === undefined || raw === "") {
            data = fresh;
            isDirty = false;
            return;
        }

        try {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (!parsed || typeof parsed !== "object") {
                data = fresh;
                isDirty = false;
                return;
            }

            data = Object.assign(fresh, parsed);
            // 部分字段做类型兜底，防止旧存档或脏数据导致运行时异常
            data.setting = Object.assign(defaultSetting(), parsed.setting || {});
            if (!Array.isArray(data.shelfSlots)) data.shelfSlots = [];
            if (!Array.isArray(data.albumUnlocked)) data.albumUnlocked = [];
            if (!data.memoryFragments || typeof data.memoryFragments !== "object") data.memoryFragments = {};
            if (typeof data.coins !== "number" || isNaN(data.coins)) data.coins = CONFIG.INIT_COINS;
            data.version = SAVE_VERSION;
        } catch (e) {
            console.error("[TSSaveSystem] 存档解析失败，已重置为默认存档", e);
            data = fresh;
        }
        isDirty = false;
    }

    /** 立即写入存档 */
    export function Save(force: boolean = false): void {
        if (!isDirty && !force) return;
        writeRaw(JSON.stringify(data));
        isDirty = false;
    }

    /** 标记存档变更，200ms 内合并写盘，避免频繁读写 */
    export function MarkDirty(): void {
        isDirty = true;
        if (saveTimer !== null) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveTimer = null;
            Save();
        }, 200);
    }

    /** 清空存档并重置为初始数据 */
    export function ClearSave(): void {
        if (saveTimer !== null) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        removeRaw();
        data = new TSGameData();
        Save(true);
    }
}
