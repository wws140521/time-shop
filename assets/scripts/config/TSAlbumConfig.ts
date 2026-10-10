/**
 * 相册回忆静态配置表
 * 每个碎片对应一段复古剧情，通过激励广告解锁。
 */
export interface TSAlbumData {
    /** 碎片唯一 ID */
    id: string;
    /** 相册标题 */
    title: string;
    /** 回忆描述文案 */
    desc: string;
    /** 美术资源路径（相对 assets/res） */
    res: string;
}

export const TSAlbumConfig: TSAlbumData[] = [
    {
        id: "fragment_01",
        title: "夏日傍晚",
        desc: "旧巷里吹来一阵晚风，小卖部的灯光温柔依旧",
        res: "album/fragment01",
    },
    {
        id: "fragment_02",
        title: "巷口游戏机",
        desc: "投一枚硬币，两个小孩能在机器前站一整个下午",
        res: "album/fragment02",
    },
    {
        id: "fragment_03",
        title: "橘子汽水",
        desc: "玻璃瓶碰在一起，是那年夏天最清脆的声音",
        res: "album/fragment03",
    },
    {
        id: "fragment_04",
        title: "老收音机",
        desc: "黄昏里沙沙的电流声，藏着整个院子的故事",
        res: "album/fragment04",
    },
];
