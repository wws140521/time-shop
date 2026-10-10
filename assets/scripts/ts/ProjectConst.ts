/**
 * 全局常量配置
 * 命名规范：常量 / 枚举 全大写 + 下划线
 */

export const PROJECT_NAME = "TimeShop";
export const GAME_TITLE = "拾光小卖部";
export const GAME_VERSION = "1.0.0";

/** 全局唯一存档 Key，携带项目前缀 TS_，杜绝多项目缓存串数据 */
export const SAVE_KEY = "TS_SAVE_DATA";
/** 存档结构版本号，用于后续数据结构升级兼容 */
export const SAVE_VERSION = 1;

/** 激励视频广告位 ID（上线前替换为微信后台申请的真实 ID） */
export const AD_UNIT_ID = "adunit-xxxxxxxxxxxxxxxx";

/** 全局玩法数值配置 */
export const CONFIG = {
    /** 新号初始金币 */
    INIT_COINS: 1200,
    /** 离线收益：每秒产出金币 */
    OFFLINE_COIN_PER_SEC: 0.2,
    /** 离线收益结算上限（秒）：24 小时 */
    MAX_OFFLINE_SEC: 24 * 3600,
    /** 顾客自动到访间隔（秒） */
    CUSTOMER_SPAWN_INTERVAL: 60,
    /** 单个顾客基础消费收益 */
    CUSTOMER_BASE_GAIN: 10,
    /** 看广告批量召唤顾客数量 */
    AD_SPAWN_CUSTOMER_COUNT: 3,
    /** 货架格子总数 */
    SHELF_SLOT_COUNT: 6,
};
