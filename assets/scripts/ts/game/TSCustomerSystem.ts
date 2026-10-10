import { _decorator, Component, Node, instantiate } from 'cc';
import { TSCustomer } from './TSCustomer';
import { CONFIG } from '../ProjectConst';
const { ccclass, property } = _decorator;

/**
 * 顾客系统
 * 定时自动刷新顾客进店消费，支持广告批量召唤。
 */
@ccclass('TSCustomerSystem')
export class TSCustomerSystem extends Component {
    public static instance: TSCustomerSystem = null!;

    @property(Node)
    public customerTemplate: Node = null!;

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
        if (!this.customerTemplate || !this.customerRoot) return;
        const custNode = instantiate(this.customerTemplate);
        custNode.active = true;
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
