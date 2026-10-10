import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { TSGameRoot } from './TSGameRoot';
import { TSShelfSystem } from './TSShelfSystem';
import { CONFIG } from '../ProjectConst';
const { ccclass, property } = _decorator;

/**
 * 顾客系统
 * 定时自动刷新顾客进店消费，支持广告批量召唤。
 */
@ccclass('TSCustomerSystem')
export class TSCustomerSystem extends Component {
    public static instance: TSCustomerSystem = null!;

    @property(Prefab)
    public customerPrefab: Prefab = null!;

    @property(Node)
    public customerRoot: Node = null!;

    private timer = 0;

    protected onLoad(): void {
        TSCustomerSystem.instance = this;
    }

    protected onDestroy(): void {
        if (TSCustomerSystem.instance === this) {
            TSCustomerSystem.instance = null!;
        }
    }

    protected update(dt: number): void {
        this.timer += dt;
        if (this.timer >= CONFIG.CUSTOMER_SPAWN_INTERVAL) {
            this.timer = 0;
            this.SpawnCustomer();
        }
    }

    /** 生成一位顾客 */
    public SpawnCustomer(): void {
        if (!this.customerPrefab || !this.customerRoot) return;
        const custNode = instantiate(this.customerPrefab);
        this.customerRoot.addChild(custNode);
        const custComp = custNode.getComponent(TSCustomer);
        if (custComp) custComp.Init();
    }

    /** 广告批量召唤顾客，逐个入场避免同帧卡顿 */
    public SpawnBatch(count: number = CONFIG.AD_SPAWN_CUSTOMER_COUNT): void {
        for (let i = 0; i < count; i++) {
            this.scheduleOnce(() => this.SpawnCustomer(), i * 0.3);
        }
    }
}

/**
 * 单个顾客
 * 进店停留后消费，产出金币（基础收益 + 货架经营加成）后离店销毁。
 */
@ccclass('TSCustomer')
export class TSCustomer extends Component {
    @property
    public baseGain: number = CONFIG.CUSTOMER_BASE_GAIN;

    /** 顾客在店内停留时长（秒） */
    @property
    public stayDuration: number = 3;

    public Init(): void {
        this.ShopLogic();
    }

    private ShopLogic(): void {
        this.scheduleOnce(() => {
            const gain = this.baseGain + TSShelfSystem.GetTotalRevenue();
            if (TSGameRoot.instance) TSGameRoot.instance.AddCoins(gain);
            if (this.node && this.node.isValid) this.node.destroy();
        }, this.stayDuration);
    }
}
