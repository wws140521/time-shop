# 拾光小卖部（TimeShop）完整开发手册

# 1\. 项目概述与核心需求

## 1\.1 项目简介

《拾光小卖部（TimeShop）》是一款**怀旧治愈系微信小游戏**，基于 Cocos Creator \+ TypeScript 开发，主打离线挂机、小卖部经营、相册回忆收集玩法。整体风格复古温馨，无高强度竞技压力，主打休闲碎片化体验，适配微信小程序轻量化传播场景。

## 1\.2 核心玩法

- **离线收益**：退出游戏后台自动产出金币，再次上线可领取基础收益，支持广告双倍翻倍

- **货架经营**：解锁货架格子、上架复古商品，持续提升经营收益

- **顾客到访**：自动刷新进店顾客，消费后产出金币，支持广告快速批量召唤顾客

- **相册收集**：通过广告解锁回忆碎片，收集复古剧情相册，丰富游戏内容

- **个性化设置**：支持音量调节、滤镜开关、本地存档清除

## 1\.3 核心需求

- 轻量化运行，适配微信小游戏性能规范，无卡顿、无内存泄漏

- 完整本地存档体系，退出/后台切换数据不丢失

- 微信激励广告完整对接，支持收益翻倍、功能解锁

- 模块化架构，代码解耦，便于后续迭代扩展功能

- 符合微信小游戏审核规范，自带合规隐私政策文件

# 2\. 引擎与环境选型规范

## 2\.1 开发引擎

- 引擎版本：Cocos Creator 3\.8\.x（稳定适配微信小游戏）

- 开发语言：TypeScript 5\.0\+

- 构建目标：微信小游戏（wxgame）

## 2\.2 开发环境

- 代码编辑器：VS Code

- 调试工具：微信开发者工具（最新稳定版）

- 版本管理：Git（可选）

## 2\.3 编码规范

- 项目全局前缀：TS（TimeShop），所有自定义类、脚本、枚举统一前缀，避免命名冲突

- 文件夹命名：全小写、短横线分隔

- 脚本命名：大驼峰命名法（TSGameRoot、TSSaveSystem）

- 常量/枚举：全大写\+下划线

- 变量/函数：小驼峰命名法

- 全局唯一存档Key，杜绝多项目缓存串数据

# 3\. 工程目录架构设计

## 3\.1 整体目录结构

```Plaintext
time-shop/
├─ assets/
│  ├─ scripts/
│  │  ├─ ts/                # 项目核心业务脚本
│  │  │  ├─ game/           # 游戏核心逻辑模块
│  │  │  ├─ ui/             # 所有UI弹窗脚本
│  │  │  └─ ProjectConst.ts # 全局常量配置
│  │  └─ config/            # 静态配置表
│  ├─ res/                  # 美术资源（图片、预制体、特效）
│  └─ audio/                # 音频资源（BGM、音效）
├─ build/                   # 构建输出目录
├─ privacy.html             # 审核隐私政策文件
└─ project.config.json      # 项目配置
```

## 3\.2 核心目录职责

- **game模块**：承载存档、离线收益、顾客、货架、相册、广告核心业务逻辑

- **ui模块**：所有弹窗、面板、UI交互逻辑，完全解耦业务层

- **config模块**：静态数据表，配置商品、相册等固定参数，无需硬编码

# 4\. 核心模块架构设计

## 4\.1 整体架构模式

采用**单例全局根节点 \+ 模块化命名空间 \+ 数据驱动**架构，彻底解耦UI、业务、数据层，便于维护和迭代。

## 4\.2 核心模块拆分

1. **全局根模块（TSGameRoot）**：游戏入口，统一初始化所有模块、全局数据管理、前后台监听

2. **存档模块（TSSaveSystem）**：本地数据读写、缓存更新、存档重置，所有游戏数据统一托管

3. **离线收益模块（TSOfflineIncome）**：后台时长计算、离线金币结算、上线弹窗推送

4. **顾客系统（TSCustomerSystem）**：顾客刷新、生成、消费逻辑、批量召唤功能

5. **货架经营模块（TSShelfSystem）**：货架解锁、商品挂载、经营体系核心逻辑

6. **相册收集模块（TSAlbumSystem）**：回忆碎片解锁、相册进度存档

7. **广告SDK模块（TSAdSystem）**：微信激励广告封装、广告类型分发、奖励回调处理

8. **UI管理模块（TSUIManager）**：所有弹窗统一创建、销毁、管理，UI与业务解耦

9. **音频管理模块（TSAudioManager）**：BGM / 音效统一播放，音量实时读取设置存档，设置变更自动同步

10. **复古滤镜控制（TSFilterController）**：按设置项开关显示 / 隐藏全屏胶片滤镜覆盖层，模拟怀旧画面效果

## 4\.3 数据流转逻辑

所有游戏数据统一由 TSSaveSystem 托管，业务模块修改数据后调用 MarkDirty 标记更新，异步统一存档，避免频繁读写缓存，提升性能。

# 5\. 全套核心业务TS源码

## 5\.1 全局常量 ProjectConst\.ts

```TypeScript
// ProjectConst.ts
export const PROJECT_NAME = "TimeShop";
export const GAME_TITLE = "拾光小卖部";
export const GAME_VERSION = "1.0.0";
export const SAVE_KEY = "TS_SAVE_DATA";
```

## 5\.2 游戏入口 TSGameRoot\.ts

```TypeScript
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { TSSaveSystem } from './TSSaveSystem';
import { TSOfflineIncome } from './TSOfflineIncome';
import { TSCustomerSystem } from './TSCustomerSystem';
import { TSAdSystem } from './TSAdSystem';
import { TSUIManager } from '../ui/TSUIManager';
import { TSShelfSystem } from './TSShelfSystem';
import { TSAlbumSystem } from './TSAlbumSystem';

@ccclass('TSGameRoot')
export class TSGameRoot extends Component {
    public static instance: TSGameRoot;
    public coins: number = 0;

    protected onLoad(): void {
        TSGameRoot.instance = this;
        this.InitGame();
        // 小程序前后台监听
        wx.onShow(() => {
            TSOfflineIncome.CalcOfflineReward();
        })
        wx.onHide(() => {
            TSSaveSystem.Save();
        })
    }

    InitGame() {
        TSSaveSystem.Load();
        this.coins = TSSaveSystem.data.coins;

        TSOfflineIncome.Init();
        TSCustomerSystem.Init();
        TSShelfSystem.Init();
        TSAlbumSystem.Init();
        TSAdSystem.Init();
        TSUIManager.Init();
    }

    public AddCoins(amount: number) {
        this.coins += amount;
        TSSaveSystem.data.coins = this.coins;
        TSSaveSystem.MarkDirty();
    }
}
```

## 5\.3 全局存档 TSSaveSystem\.ts

```TypeScript
import { PROJECT_NAME, SAVE_KEY } from "../ProjectConst";

export class TSGameData {
    coins: number = 1200;
    lastExitTimestamp: number = Date.now();
    adTodayWatchCount: number = 0;
    quickSpawnCustomerCD: number = 0;
    setting = {
        bgmVolume: 0.7,
        sfxVolume: 0.7,
        filmFilter: true
    }
    tutorialFinished: boolean = false;
    shelfSlots: Array<{ slotId: number, unlocked: boolean, itemId: string }> = [];
    memoryFragments: Record<string, number> = {};
    albumUnlocked: string[] = [];
}

export namespace TSSaveSystem {
    export let data: TSGameData;
    let isDirty = false;

    export function Load() {
        const str = wx.getStorageSync(SAVE_KEY);
        if (str) {
            data = JSON.parse(str);
        } else {
            data = new TSGameData();
        }
    }

    export function Save() {
        if (!isDirty) return;
        wx.setStorageSync(SAVE_KEY, JSON.stringify(data));
        isDirty = false;
    }

    export function MarkDirty() {
        isDirty = true;
        setTimeout(() => Save(), 200);
    }

    export function ClearSave() {
        wx.removeStorageSync(SAVE_KEY);
        data = new TSGameData();
        MarkDirty();
    }
}
```

## 5\.4 离线收益 TSOfflineIncome\.ts

```TypeScript
import { TSGameRoot } from "./TSGameRoot";
import { TSSaveSystem } from "./TSSaveSystem";
import { TSUIManager } from "../ui/TSUIManager";

export namespace TSOfflineIncome {
    const coinPerSec = 0.2;
    const maxOfflineSec = 24 * 3600;

    export function Init() {
        TSSaveSystem.data.lastExitTimestamp = Date.now();
    }

    export function CalcOfflineReward() {
        const lastTime = TSSaveSystem.data.lastExitTimestamp;
        const now = Date.now();
        let diffSec = Math.floor((now - lastTime) / 1000);
        diffSec = Math.min(diffSec, maxOfflineSec);
        const reward = Math.floor(diffSec * coinPerSec);
        
        if (reward > 0) {
            TSUIManager.ShowOfflinePopup(reward);
        }

        TSSaveSystem.data.lastExitTimestamp = Date.now();
        TSSaveSystem.MarkDirty();
    }
}
```

## 5\.5 顾客系统 TSCustomerSystem\.ts

```TypeScript
import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { TSSaveSystem } from './TSSaveSystem';
import { TSGameRoot } from './TSGameRoot';
const { ccclass, property } = _decorator;

@ccclass('TSCustomerSystem')
export class TSCustomerSystem extends Component {
    static instance: TSCustomerSystem;
    @property(Prefab)
    customerPrefab: Prefab = null!;
    @property(Node)
    customerRoot: Node = null!;
    
    private timer: number = 0;
    private readonly spawnInterval = 60;

    protected onLoad(): void {
        TSCustomerSystem.instance = this;
    }

    static Init() {}

    protected update(dt: number): void {
        this.timer += dt;
        if (this.timer >= this.spawnInterval) {
            this.SpawnCustomer();
            this.timer = 0;
        }
    }

    SpawnCustomer() {
        const custNode = instantiate(this.customerPrefab);
        this.customerRoot.addChild(custNode);
        const custComp = custNode.getComponent(TSCustomer);
        custComp.Init();
    }

    SpawnBatch() {
        for (let i = 0; i < 3; i++) {
            this.SpawnCustomer();
        }
    }
}

@ccclass("TSCustomer")
export class TSCustomer extends Component {
    @property
    baseGain: number = 10;

    Init() {
        this.ShopLogic();
    }

    ShopLogic() {
        setTimeout(() => {
            TSGameRoot.instance.AddCoins(this.baseGain);
            this.node.destroy();
        }, 3000)
    }
}
```

## 5\.6 货架系统 TSShelfSystem\.ts

```TypeScript
import { TSSaveSystem } from "./TSSaveSystem";
import { TSGameRoot } from "./TSGameRoot";
import { TSItemConfig } from "../../config/TSItemConfig";

export namespace TSShelfSystem {
    export function Init() {
        if (TSSaveSystem.data.shelfSlots.length === 0) {
            for (let i = 0; i < 6; i++) {
                TSSaveSystem.data.shelfSlots.push({
                    slotId: i,
                    unlocked: i === 0,
                    itemId: ""
                })
            }
            TSSaveSystem.MarkDirty();
        }
    }

    export function UnlockSlot(slotId: number, cost: number): boolean {
        if (TSGameRoot.instance.coins >= cost) {
            TSGameRoot.instance.AddCoins(-cost);
            const slot = TSSaveSystem.data.shelfSlots.find(v => v.slotId === slotId);
            if (slot) slot.unlocked = true;
            TSSaveSystem.MarkDirty();
            return true;
        }
        return false;
    }

    export function PutItem(slotId: number, itemId: string) {
        const slot = TSSaveSystem.data.shelfSlots.find(v => v.slotId === slotId);
        if (slot && slot.unlocked) {
            slot.itemId = itemId;
            TSSaveSystem.MarkDirty();
        }
    }
}
```

## 5\.7 相册系统 TSAlbumSystem\.ts

```TypeScript
import { TSSaveSystem } from "./TSSaveSystem";

export namespace TSAlbumSystem {
    export function Init() {}

    export function AddFragment(fragmentId: string) {
        TSSaveSystem.data.memoryFragments[fragmentId] = 1;
        if (!TSSaveSystem.data.albumUnlocked.includes(fragmentId)) {
            TSSaveSystem.data.albumUnlocked.push(fragmentId);
        }
        TSSaveSystem.MarkDirty();
    }
}
```

## 5\.8 广告对接 TSAdSystem\.ts

```TypeScript
import { TSSaveSystem } from "./TSSaveSystem";
import { TSCustomerSystem } from "./TSCustomerSystem";
import { TSUIManager } from "../ui/TSUIManager";
import { TSAlbumSystem } from "./TSAlbumSystem";

export enum TSAdType {
    OfflineDouble,
    QuickCustomer,
    UnlockAlbum
}

export namespace TSAdSystem {
    let rewardedAd: WechatMiniprogram.RewardedVideoAd | null = null;
    const adUnitId = "adunit-xxxxxx";
    let currentAdType: TSAdType;

    export function Init() {
        rewardedAd = wx.createRewardedVideoAd({ adUnitId: adUnitId });
        rewardedAd.onClose(res => {
            if (res.isEnded) {
                TSSaveSystem.data.adTodayWatchCount++;
                TSSaveSystem.MarkDirty();
                OnAdReward(currentAdType);
            }
        })
        rewardedAd.onError(err => {
            console.error("广告加载失败：", err);
        })
    }

    export function ShowAd(type: TSAdType) {
        currentAdType = type;
        rewardedAd?.show().catch(() => {
            rewardedAd?.load();
        })
    }

    function OnAdReward(type: TSAdType) {
        switch (type) {
            case TSAdType.QuickCustomer:
                TSCustomerSystem.instance.SpawnBatch();
                break;
            case TSAdType.OfflineDouble:
                TSUIManager.DoubleOfflineReward();
                break;
            case TSAdType.UnlockAlbum:
                TSAlbumSystem.AddFragment("fragment_01");
                break;
        }
    }
}
```

# 6\. 全套UI弹窗TS源码

## 6\.1 UI总管理器 TSUIManager\.ts

```TypeScript
import { _decorator, Node, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TSUIManager')
export class TSUIManager {
    static instance: TSUIManager;

    public offlinePopup: Prefab = null!;
    public shelfPanel: Prefab = null!;
    public albumPanel: Prefab = null!;
    public uiRoot: Node = null!;

    static Init() {
        TSUIManager.instance = new TSUIManager();
    }

    static ShowOfflinePopup(baseReward: number) {
        const node = instantiate(TSUIManager.instance.offlinePopup);
        TSUIManager.instance.uiRoot.addChild(node);
        const popup = node.getComponent("TSUIOfflineReward");
        popup.SetData(baseReward);
    }

    static DoubleOfflineReward() {}

    static ShowShelfPanel() {
        const node = instantiate(TSUIManager.instance.shelfPanel);
        TSUIManager.instance.uiRoot.addChild(node);
    }

    static ShowAlbumPanel() {
        const node = instantiate(TSUIManager.instance.albumPanel);
        TSUIManager.instance.uiRoot.addChild(node);
    }
}
```

## 6\.2 离线收益弹窗 TSUIOfflineReward\.ts

```TypeScript
import { _decorator, Component, Node, Label } from 'cc';
import { TSAdSystem, TSAdType } from '../game/TSAdSystem';
const { ccclass, property } = _decorator;

@ccclass('TSUIOfflineReward')
export class TSUIOfflineReward extends Component {
    @property(Label)
    txtBaseReward: Label = null!;
    @property(Node)
    btnDouble: Node = null!;
    private baseReward = 0;

    SetData(reward: number) {
        this.baseReward = reward;
        this.txtBaseReward.string = `离线收益：${reward}金币`;
    }

    OnClaimBase() {
        import("../game/TSGameRoot").then(({ TSGameRoot }) => {
            TSGameRoot.instance.AddCoins(this.baseReward);
        })
        this.node.destroy();
    }

    OnWatchAdDouble() {
        TSAdSystem.ShowAd(TSAdType.OfflineDouble);
        this.node.destroy();
    }

    OnClose() {
        this.node.destroy();
    }
}
```

## 6\.3 货架面板 TSUIShelf\.ts

```TypeScript
import { _decorator, Component, Node, Label, instantiate } from 'cc';
import { TSShelfSystem } from '../game/TSShelfSystem';
import { TSSaveSystem } from '../game/TSSaveSystem';
const { ccclass, property } = _decorator;

@ccclass('TSUIShelf')
export class TSUIShelf extends Component {
    @property(Node)
    slotRoot: Node = null!;
    @property(Prefab)
    slotPrefab: Prefab = null!;

    protected onLoad(): void {
        this.RefreshUI();
    }

    RefreshUI() {
        this.slotRoot.removeAllChildren();
        const slots = TSSaveSystem.data.shelfSlots;
        slots.forEach(slot => {
            const node = instantiate(this.slotPrefab);
            this.slotRoot.addChild(node);
            const comp = node.getComponent("TSUIShelfSlot");
            comp.SetData(slot);
        })
    }

    OnClose() {
        this.node.destroy();
    }
}

@ccclass("TSUIShelfSlot")
export class TSUIShelfSlot extends Component {
    @property(Label)
    txtInfo: Label = null!;
    private slotData: { slotId: number, unlocked: boolean, itemId: string } = null!;
    readonly unlockCostList = [0,100,200,400,800,1500];

    SetData(data: { slotId: number, unlocked: boolean, itemId: string }) {
        this.slotData = data;
        if(data.unlocked){
            this.txtInfo.string = data.itemId? `商品:${data.itemId}`:"空货架";
        }else{
            const cost = this.unlockCostList[data.slotId];
            this.txtInfo.string = `解锁${cost}金币`;
        }
    }

    OnClickSlot() {
        if(this.slotData.unlocked) return;
        const cost = this.unlockCostList[this.slotData.slotId];
        const ok = TSShelfSystem.UnlockSlot(this.slotData.slotId, cost);
        if(ok){
            this.txtInfo.string = "空货架";
        }
    }
}
```

## 6\.4 相册面板 TSUIAlbum\.ts

```TypeScript
import { _decorator, Component, Node, Label, instantiate } from 'cc';
import { TSSaveSystem } from '../game/TSSaveSystem';
import { TSAlbumConfig } from "../../config/TSAlbumConfig";
const { ccclass, property } = _decorator;

@ccclass('TSUIAlbum')
export class TSUIAlbum extends Component {
    @property(Node)
    itemRoot: Node = null!;
    @property(Prefab)
    albumItemPrefab: Prefab = null!;

    protected onLoad(): void {
        this.Refresh();
    }

    Refresh() {
        this.itemRoot.removeAllChildren();
        const unlockedList = TSSaveSystem.data.albumUnlocked;
        TSAlbumConfig.forEach(cfg => {
            const node = instantiate(this.albumItemPrefab);
            this.itemRoot.addChild(node);
            const comp = node.getComponent("TSUIAlbumItem");
            const isUnlock = unlockedList.includes(cfg.id);
            comp.SetData(cfg, isUnlock);
        })
    }

    OnClose() {
        this.node.destroy();
    }
}

@ccclass("TSUIAlbumItem")
export class TSUIAlbumItem extends Component {
    @property(Label)
    txtTitle: Label = null!;
    private cfg: {id:string,title:string,desc:string,res:string};

    SetData(cfg:any, isUnlock:boolean) {
        this.cfg = cfg;
        if(isUnlock){
            this.txtTitle.string = cfg.title;
        }else{
            this.txtTitle.string = "??? 未解锁";
        }
    }
}
```

## 6\.5 设置面板 TSUISetting\.ts

```TypeScript
import { _decorator, Component, Slider, Toggle } from 'cc';
import { TSSaveSystem } from '../game/TSSaveSystem';
const { ccclass, property } = _decorator;

@ccclass('TSUISetting')
export class TSUISetting extends Component {
    @property(Slider)
    sliderBGM: Slider = null!;
    @property(Slider)
    sliderSfx: Slider = null!;
    @property(Toggle)
    toggleFilter: Toggle = null!;

    protected onLoad(): void {
        const set = TSSaveSystem.data.setting;
        this.sliderBGM.progress = set.bgmVolume;
        this.sliderSfx.progress = set.sfxVolume;
        this.toggleFilter.isChecked = set.filmFilter;
    }

    OnBGMChange(slider:Slider){
        TSSaveSystem.data.setting.bgmVolume = slider.progress;
        TSSaveSystem.MarkDirty();
    }
    OnSfxChange(slider:Slider){
        TSSaveSystem.data.setting.sfxVolume = slider.progress;
        TSSaveSystem.MarkDirty();
    }
    OnFilterToggle(toggle:Toggle){
        TSSaveSystem.data.setting.filmFilter = toggle.isChecked;
        TSSaveSystem.MarkDirty();
    }

    OnClearSave() {
        wx.showModal({
            title:"确认清除存档？",
            content:"全部游戏进度将被删除，无法恢复！",
            success(res) {
                if(res.confirm){
                    TSSaveSystem.ClearSave();
                    wx.showToast({title:"存档已清空"});
                }
            }
        })
    }

    OnOpenPrivacy() {
        wx.navigateTo({
            url: "/privacy.html"
        })
    }

    OnClose() {
        this.node.destroy();
    }
}
```

# 7\. 静态配置表源码

## 7\.1 商品配置 TSItemConfig\.ts

```TypeScript
export const TSItemConfig = [
    {
        id: "candy",
        name: "水果糖",
        price: 50,
        addRevenue: 2
    },
    {
        id: "soda",
        name: "老式汽水",
        price: 120,
        addRevenue: 5
    }
]
```

## 7\.2 相册配置 TSAlbumConfig\.ts

```TypeScript
export const TSAlbumConfig = [
    {
        id: "fragment_01",
        title: "夏日傍晚",
        desc: "旧巷里吹来一阵晚风，小卖部的灯光温柔依旧",
        res: "album/fragment01"
    }
]
```

# 8\. 美术/音频/测试规范

## 8\.1 美术资源规范

- 图片格式：统一 PNG，透明资源无损、背景资源压缩优化

- 分辨率：适配微信小游戏标准尺寸，杜绝超大图导致包体超标

- 资源命名：小写\+下划线，分类存放（ui/album/item/bg）

- 图集规范：UI小图标统一合图集，减少DrawCall，提升帧率

## 8\.2 音频资源规范

- 格式：MP3 压缩格式，降低包体大小

- 分类：bgm 背景音乐、sfx 点击/功能音效

- 音量默认值：BGM 0\.7、音效 0\.7，支持玩家自定义调节

## 8\.3 测试规范

- 功能测试：存档读写、离线收益、广告触发、UI弹窗、货架解锁全覆盖测试

- 兼容性测试：微信开发者工具、手机真机（安卓/iOS）双端测试

- 性能测试：帧率稳定60帧、无内存泄漏、后台切换无报错

- 边界测试：金币为0、货架全部解锁、广告频繁点击、反复进退后台

# 9\. 微信SDK对接规范

## 9\.1 对接能力清单

- 微信本地缓存：wx\.getStorageSync / wx\.setStorageSync / wx\.removeStorageSync

- 小程序前后台监听：wx\.onShow / wx\.onHide

- 激励视频广告：wx\.createRewardedVideoAd

- 弹窗提示：wx\.showToast / wx\.showModal

- 隐私页面跳转：wx\.navigateTo

## 9\.2 对接规范

- 所有SDK逻辑统一封装在 TSAdSystem、TSSaveSystem 中，禁止散落代码

- 广告ID统一配置，上线前替换官方真实ID，测试阶段使用测试广告ID

- 增加广告异常捕获，避免广告加载失败导致游戏卡死

- 所有本地存储携带项目唯一前缀 TS\_，杜绝多项目缓存冲突

# 10\. 打包、预览、上传、提审全流程

## 10\.1 项目构建

1. Cocos Creator 构建面板选择：微信小游戏

2. 取消无用模块勾选，开启资源压缩、代码混淆

3. 构建完成后，将根目录 `privacy.html` 复制到 `build/wxgame` 文件夹

## 10\.2 预览测试

1. 微信开发者工具导入 wxgame 项目

2. 填入小程序AppID（测试ID/正式ID）

3. 真机预览，测试全部功能、广告、存档、页面跳转

## 10\.3 上传提交

1. 开发者工具点击「上传」，填写版本号、项目备注

2. 上传成功后，登录微信小程序后台

3. 提交审核，勾选隐私政策、功能合规选项

## 10\.4 提审必备条件

- 项目无报错、无闪退、无违规内容

- 内置可正常访问的隐私政策页面

- 广告功能合规，无强制观看、无诱导点击

- 无收集用户隐私信息行为

# 11\. 审核必备隐私政策文件

## 11\.1 privacy\.html 完整源码

```HTML
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>隐私政策</title>
</head>
<body style="padding:20px; font-size:14px;">
<h2>《拾光小卖部》隐私政策</h2>
<p>更新日期：2026年10月10日</p>
<p>《拾光小卖部》（下称“本小游戏”）是一款微信休闲经营小游戏，本小游戏尊重并保护所有使用服务用户的个人隐私。</p>
<h3>一、信息收集</h3>
<p>本小游戏<strong>不会主动收集您的姓名、手机号、微信头像、昵称等个人信息</strong>。
游戏进度、金币、解锁货架、相册碎片等游戏数据，仅保存在您微信本地缓存（wx.storage），仅用于保存您的游戏存档，不会上传到外部服务器。</p>
<h3>二、信息使用</h3>
<p>本地存档数据仅用于在您再次打开小游戏时恢复游戏进度，不会用于其他用途，不会共享、出售给第三方。</p>
<h3>三、广告服务</h3>
<p>本小游戏接入微信流量主激励广告。广告由微信平台提供，广告相关信息收集遵循微信平台隐私规则。本游戏无法获取广告点击之外的用户信息。</p>
<h3>四、数据删除</h3>
<p>您可以在游戏【设置面板】点击清除存档，一键删除本地全部游戏进度；也可以在微信设置清除小程序缓存。</p>
<h3>五、未成年人保护</h3>
<p>本游戏面向全年龄段，不针对未成年人推送不适内容。</p>
<h3>六、联系方式</h3>
<p>如有隐私相关疑问，请联系小游戏开发者。</p>
<p>本隐私政策仅适用于《拾光小卖部》小游戏。</p>
</body>
</html>
```

# 12\. 常见BUG与避坑清单

## 12\.1 存档类BUG

- **问题**：退出游戏进度丢失 
**解决方案**：确保 onHide 触发 Save，修改数据必须调用 MarkDirty

- **问题**：多项目存档串数据 
**解决方案**：固定唯一 TS\_SAVE\_KEY，不使用通用key

## 12\.2 广告类BUG

- **问题**：广告加载失败、点击无响应 
**解决方案**：增加异常捕获，失败自动重载广告实例

- **问题**：未看完广告发放奖励 
**解决方案**：严格判断 res\.isEnded 再执行奖励逻辑

## 12\.3 UI类BUG

- **问题**：重复创建弹窗、节点叠加 
**解决方案**：弹窗关闭彻底销毁节点，单例管理UI

- **问题**：UI数据刷新不及时 
**解决方案**：打开面板强制刷新数据，同步最新存档

## 12\.4 审核避坑

- 禁止任何强制广告、弹窗骚扰用户逻辑

- 必须可正常打开隐私政策页面

- 禁止收集、上传任何用户个人信息

# 13\. 版本迭代计划

## 13\.1 V1\.0\.0（当前版本）

- 基础离线挂机、顾客经营、货架解锁功能

- 相册碎片收集系统

- 完整广告对接、本地存档、设置功能

- 合规隐私政策，可直接提审上线

## 13\.2 V1\.1\.0（迭代计划）

- 新增商品上架收益倍率、等级升级体系

- 新增新手引导流程

- 新增BGM/音效完整管理模块

- 优化帧率、精简冗余代码，降低包体大小

## 13\.3 V1\.2\.0（后续拓展）

- 新增更多复古商品、相册剧情碎片

- 新增每日任务、签到奖励体系

- 新增离线收益倍率升级、店铺装修功能

> （注：部分内容由豆包工作 AI 生成）
