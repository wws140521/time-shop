/**
 * 商品静态配置表
 * 货架格按数组顺序逐档升级，price 为升级到该档所需金币，addRevenue 为该档带来的额外收益。
 */
export interface TSItemData {
    /** 商品唯一 ID */
    id: string;
    /** 商品名称 */
    name: string;
    /** 上架 / 升级消耗金币 */
    price: number;
    /** 每单额外收益加成 */
    addRevenue: number;
}

export const TSItemConfig: TSItemData[] = [
    { id: "candy", name: "水果糖", price: 50, addRevenue: 2 },
    { id: "soda", name: "老式汽水", price: 120, addRevenue: 5 },
    { id: "popsicle", name: "白糖冰棍", price: 260, addRevenue: 9 },
    { id: "comic", name: "小人书", price: 520, addRevenue: 16 },
    { id: "radio", name: "旧收音机", price: 1000, addRevenue: 28 },
    { id: "fan", name: "铁皮风扇", price: 2000, addRevenue: 45 },
];
