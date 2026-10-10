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

/** 用来源数据覆盖目标对象（保持 data 引用不变，满足 Babel 命名空间导出限制） */
function applyData(target: TSGameData, source: Partial<TSGameData> | null): void {
    const fresh = new TSGameData();
    const src = source || fresh;
    target.version = SAVE_VERSION;
    target.coins = typeof src.coins === "number" && !isNaN(src.coins) ? src.coins : fresh.coins;
    target.lastExitTimestamp = typeof src.lastExitTimestamp === "number" ? src.lastExitTimestamp : fresh.lastExitTimestamp;
    target.adTodayWatchCount = typeof src.adTodayWatchCount === "number" ? src.adTodayWatchCount : 0;
    target.quickSpawnCustomerCD = typeof src.quickSpawnCustomerCD === "number" ? src.quickSpawnCustomerCD : 0;
    target.tutorialFinished = !!src.tutorialFinished;
    target.setting = Object.assign(defaultSetting(), src.setting || {});
    target.shelfSlots = Array.isArray(src.shelfSlots) ? src.shelfSlots : [];
    target.memoryFragments = src.memoryFragments && typeof src.memoryFragments === "object" ? src.memoryFragments : {};
    target.albumUnlocked = Array.isArray(src.albumUnlocked) ? src.albumUnlocked : [];
}

/**
 * 全局存档系统
 * 所有游戏数据统一托管于此，业务模块调用 MarkDirty 标记更新，异步合并存档，避免频繁读写。
 */
export namespace TSSaveSystem {
    // 注意：Cocos 使用 Babel 编译 TS，命名空间内只能导出 const，不能导出 let/var
    export const data: TSGameData = new TSGameData();

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
        const raw = readRaw();
        let parsed: any = null;
        if (raw !== null && raw !== undefined && raw !== "") {
            try {
                const decoded = typeof raw === "string" ? JSON.parse(raw) : raw;
                if (decoded && typeof decoded === "object") parsed = decoded;
            } catch (e) {
                console.error("[TSSaveSystem] 存档解析失败，已重置为默认存档", e);
                parsed = null;
            }
        }
        applyData(data, parsed);
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
        applyData(data, null);
        Save(true);
    }
}
