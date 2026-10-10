import { EventTarget } from 'cc';

/**
 * 全局事件总线
 * 业务层修改数据后派发事件，UI 层监听事件刷新界面，实现业务与 UI 解耦。
 */
export const TSEvent = new EventTarget();

/** 全局事件类型枚举 */
export enum TSEventType {
    /** 金币变化，参数：当前金币数 */
    COINS_CHANGED = "TS_COINS_CHANGED",
    /** 货架数据变化 */
    SHELF_CHANGED = "TS_SHELF_CHANGED",
    /** 相册解锁数据变化 */
    ALBUM_CHANGED = "TS_ALBUM_CHANGED",
    /** 设置项变化 */
    SETTING_CHANGED = "TS_SETTING_CHANGED",
}
