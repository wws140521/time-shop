'use strict';

/**
 * TimeShop 场景生成器 —— 场景进程脚本
 * 在已打开的场景中生成：
 *   Canvas
 *   └─ TSRoot (TSGameRoot)
 *      ├─ HUD (TSUIMainHUD) + 金币/进度 Label + 4 个入口按钮
 *      ├─ uiRoot            弹窗父节点
 *      ├─ AudioManager (TSAudioManager + 2x AudioSource)
 *      ├─ Filter (TSFilterController) + FilterOverlay
 *      ├─ CustomerSystem (TSCustomerSystem) + customerRoot
 *      └─ Templates (隐藏，存放各面板/条目模板节点)
 *
 * 说明：面板统一使用「场景内隐藏模板节点 + 运行时 instantiate」的方式，等价于预制体，
 *       但可由扩展 100% 自动生成并完成绑定。
 */

// 允许在场景进程中 require 到 cc 模块
try {
    const { join } = require('path');
    module.paths.push(join(Editor.App.path, 'node_modules'));
} catch (e) {
    // ignore
}

const cc = require('cc');
const Node = cc.Node;
const Layers = cc.Layers;
const Color = cc.Color;
const Size = cc.Size;

const UI_LAYER = Layers.Enum.UI_2D;
const EventHandlerClass = (cc.Component && cc.Component.EventHandler) || null;

let errors = [];

// ---------------------------------------------------------------------------
// 通用节点工具
// ---------------------------------------------------------------------------

function newNode(name, parent, x, y, w, h) {
    const n = new Node(name);
    n.layer = UI_LAYER;
    n.addComponent('cc.UITransform').setContentSize(w || 200, h || 60);
    if (parent) parent.addChild(n);
    n.setPosition(x || 0, y || 0, 0);
    return n;
}

function addLabel(node, text, fontSize) {
    const label = node.addComponent('cc.Label');
    label.string = text;
    label.fontSize = fontSize || 24;
    label.lineHeight = (fontSize || 24) + 8;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    return label;
}

function addButton(node, targetComp, handler) {
    const btn = node.addComponent('cc.Button');
    btn.transition = 0; // NONE
    if (targetComp && handler) {
        if (!EventHandlerClass) {
            errors.push('无法解析 EventHandler，按钮事件未绑定：' + handler);
            return btn;
        }
        try {
            const eh = new EventHandlerClass();
            eh.target = targetComp.node;
            eh.component = getClassName(targetComp);
            eh.handler = handler;
            eh.customEventData = '';
            btn.clickEvents = [eh];
        } catch (e) {
            errors.push('绑定按钮事件失败 ' + handler + ': ' + e.message);
        }
    }
    return btn;
}

function getClassName(comp) {
    try {
        if (cc.js && cc.js.getClassName) return cc.js.getClassName(comp);
    } catch (e) { /* ignore */ }
    return (comp && comp.constructor && comp.constructor.name) || '';
}

function addGridLayout(node, cols, cellW, cellH) {
    try {
        const layout = node.addComponent('cc.Layout');
        layout.type = cc.Layout.Type.GRID;
        layout.resizeMode = cc.Layout.ResizeMode.NONE;
        layout.startAxis = cc.Layout.AxisDirection.HORIZONTAL;
        layout.constraint = cc.Layout.Constraint.FIXED_COL;
        layout.constraintNum = cols;
        layout.cellSize = new Size(cellW, cellH);
        layout.spacingX = 12;
        layout.spacingY = 12;
        layout.paddingTop = 10;
        layout.paddingBottom = 10;
        layout.paddingLeft = 10;
        layout.paddingRight = 10;
    } catch (e) {
        errors.push('Grid Layout 创建失败: ' + e.message);
    }
}

function addVerticalLayout(node, spacing) {
    try {
        const layout = node.addComponent('cc.Layout');
        layout.type = cc.Layout.Type.VERTICAL;
        layout.resizeMode = cc.Layout.ResizeMode.NONE;
        layout.spacingY = spacing || 12;
        layout.paddingTop = 10;
        layout.paddingBottom = 10;
        layout.paddingLeft = 10;
        layout.paddingRight = 10;
    } catch (e) {
        errors.push('Vertical Layout 创建失败: ' + e.message);
    }
}

function makeSlider(name, parent, x, y) {
    const node = newNode(name, parent, x, y, 300, 36);
    const slider = node.addComponent('cc.Slider');
    slider.progress = 0.7;
    let bg = null;
    let handle = null;
    try {
        bg = newNode('Background', node, 0, 0, 300, 10);
        bg.addComponent('cc.Sprite');
        handle = newNode('Handle', node, 0, 0, 36, 36);
        handle.addComponent('cc.Sprite');
        try { slider.handle = handle.getComponent('cc.Sprite'); } catch (e) { slider.handle = handle; }
        try { slider.background = bg.getComponent('cc.Sprite'); } catch (e) { /* ignore */ }
    } catch (e) {
        errors.push('Slider ' + name + ' 创建失败: ' + e.message);
    }
    return node;
}

function makeToggle(name, parent, x, y) {
    const node = newNode(name, parent, x, y, 44, 44);
    const toggle = node.addComponent('cc.Toggle');
    toggle.isChecked = true;
    try {
        const check = newNode('Checkmark', node, 0, 0, 40, 40);
        check.addComponent('cc.Sprite');
        try { toggle.checkMark = check.getComponent('cc.Sprite'); } catch (e) { toggle.checkMark = check; }
    } catch (e) {
        errors.push('Toggle ' + name + ' 创建失败: ' + e.message);
    }
    return node;
}

function createDefaultCanvas(scene) {
    const canvasNode = new Node('Canvas');
    canvasNode.layer = UI_LAYER;
    scene.addChild(canvasNode);
    canvasNode.addComponent('cc.UITransform');
    const canvas = canvasNode.addComponent('cc.Canvas');
    const camNode = new Node('Camera');
    camNode.layer = UI_LAYER;
    canvasNode.addChild(camNode);
    camNode.setPosition(0, 0, 1000);
    try {
        const camera = camNode.addComponent('cc.Camera');
        camera.projection = cc.Camera.ProjectionType.ORTHO;
        camera.clearFlags = cc.Camera.ClearFlag.SOLID_COLOR;
        camera.clearColor = new Color(40, 32, 28, 255);
        camera.visibility = UI_LAYER;
        camera.near = 1;
        camera.far = 2000;
        canvas.cameraComponent = camera;
    } catch (e) {
        errors.push('Camera 创建失败: ' + e.message);
    }
    canvas.alignCanvasWithScreen = true;
    return canvasNode;
}

// ---------------------------------------------------------------------------
// 构建
// ---------------------------------------------------------------------------

function buildHUD(root) {
    const hud = newNode('HUD', root, 0, 0, 960, 640);
    const comp = hud.addComponent('TSUIMainHUD');

    const coinNode = newNode('txtCoins', hud, -300, 270, 320, 56);
    const coinLabel = addLabel(coinNode, '0', 36);
    coinLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;

    const albumNode = newNode('txtAlbumProgress', hud, 300, 270, 320, 56);
    const albumLabel = addLabel(albumNode, '回忆 0/4', 26);
    albumLabel.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;

    const btnShelf = newNode('btnShelf', hud, -330, 150, 180, 84);
    addLabel(btnShelf, '货架', 30);
    addButton(btnShelf, comp, 'OnClickShelf');

    const btnAlbum = newNode('btnAlbum', hud, -110, 150, 180, 84);
    addLabel(btnAlbum, '相册', 30);
    addButton(btnAlbum, comp, 'OnClickAlbum');

    const btnSetting = newNode('btnSetting', hud, 110, 150, 180, 84);
    addLabel(btnSetting, '设置', 30);
    addButton(btnSetting, comp, 'OnClickSetting');

    const btnQuick = newNode('btnQuickCustomer', hud, 340, 150, 220, 84);
    addLabel(btnQuick, '召唤顾客', 28);
    addButton(btnQuick, comp, 'OnClickQuickCustomer');

    comp.txtCoins = coinLabel;
    comp.txtAlbumProgress = albumLabel;
    comp.btnQuickCustomer = btnQuick;
    return comp;
}

function buildOfflineTemplate(templates) {
    const node = newNode('OfflineReward', templates, 0, 0, 640, 420);
    const comp = node.addComponent('TSUIOfflineReward');

    addLabel(newNode('title', node, 0, 150, 520, 60), '离线收益', 40);
    const baseLabel = addLabel(newNode('txtBaseReward', node, 0, 60, 520, 50), '离线收益：0 金币', 28);
    const doubleLabel = addLabel(newNode('txtDoubleReward', node, 0, 0, 520, 50), '看广告领取：0 金币', 28);

    const btnClaim = newNode('btnClaimBase', node, -150, -120, 240, 84);
    addLabel(btnClaim, '直接领取', 28);
    addButton(btnClaim, comp, 'OnClaimBase');

    const btnDouble = newNode('btnWatchAd', node, 150, -120, 240, 84);
    addLabel(btnDouble, '看广告双倍', 28);
    addButton(btnDouble, comp, 'OnWatchAdDouble');

    const btnClose = newNode('btnClose', node, 290, 180, 60, 60);
    addLabel(btnClose, 'X', 30);
    addButton(btnClose, comp, 'OnClose');

    comp.txtBaseReward = baseLabel;
    comp.txtDoubleReward = doubleLabel;
    node.active = false;
    return node;
}

function buildShelfSlotTemplate(templates) {
    const node = newNode('ShelfSlot', templates, 0, 0, 240, 180);
    const comp = node.addComponent('TSUIShelfSlot');
    const infoLabel = addLabel(newNode('txtInfo', node, 0, 34, 220, 50), '空货架', 26);
    const costLabel = addLabel(newNode('txtCost', node, 0, -34, 220, 44), '升级 0 金币', 22);
    comp.txtInfo = infoLabel;
    comp.txtCost = costLabel;
    addButton(node, comp, 'OnClickSlot');
    node.active = false;
    return node;
}

function buildShelfPanelTemplate(templates, slotTemplate) {
    const node = newNode('ShelfPanel', templates, 0, 0, 820, 560);
    const comp = node.addComponent('TSUIShelf');
    addLabel(newNode('title', node, 0, 250, 400, 60), '货架经营', 38);

    const slotRoot = newNode('slotRoot', node, 0, -20, 780, 420);
    addGridLayout(slotRoot, 3, 240, 180);

    const btnClose = newNode('btnClose', node, 360, 250, 60, 60);
    addLabel(btnClose, 'X', 30);
    addButton(btnClose, comp, 'OnClose');

    comp.slotRoot = slotRoot;
    comp.slotTemplate = slotTemplate;
    node.active = false;
    return node;
}

function buildAlbumItemTemplate(templates) {
    const node = newNode('AlbumItem', templates, 0, 0, 720, 110);
    const comp = node.addComponent('TSUIAlbumItem');
    const titleLabel = addLabel(newNode('txtTitle', node, -170, 20, 340, 40), '??? 未解锁', 28);
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
    const descLabel = addLabel(newNode('txtDesc', node, -170, -28, 340, 40), '', 20);
    descLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;

    const btnUnlock = newNode('btnUnlock', node, 250, 0, 180, 72);
    addLabel(btnUnlock, '看广告解锁', 24);
    addButton(btnUnlock, comp, 'OnWatchAdUnlock');

    comp.txtTitle = titleLabel;
    comp.txtDesc = descLabel;
    comp.btnUnlock = btnUnlock;
    node.active = false;
    return node;
}

function buildAlbumPanelTemplate(templates, itemTemplate) {
    const node = newNode('AlbumPanel', templates, 0, 0, 820, 560);
    const comp = node.addComponent('TSUIAlbum');
    addLabel(newNode('title', node, 0, 250, 400, 60), '回忆相册', 38);

    const itemRoot = newNode('itemRoot', node, 0, -20, 780, 420);
    addVerticalLayout(itemRoot, 12);

    const btnClose = newNode('btnClose', node, 360, 250, 60, 60);
    addLabel(btnClose, 'X', 30);
    addButton(btnClose, comp, 'OnClose');

    comp.itemRoot = itemRoot;
    comp.albumItemTemplate = itemTemplate;
    node.active = false;
    return node;
}

function buildSettingPanelTemplate(templates) {
    const node = newNode('SettingPanel', templates, 0, 0, 720, 540);
    const comp = node.addComponent('TSUISetting');
    addLabel(newNode('title', node, 0, 235, 400, 60), '设置', 38);

    addLabel(newNode('lblBGM', node, -250, 130, 140, 44), '音乐', 26);
    const bgmNode = makeSlider('sliderBGM', node, 40, 130);

    addLabel(newNode('lblSfx', node, -250, 40, 140, 44), '音效', 26);
    const sfxNode = makeSlider('sliderSfx', node, 40, 40);

    addLabel(newNode('lblFilter', node, -250, -50, 140, 44), '滤镜', 26);
    const toggleNode = makeToggle('toggleFilter', node, -170, -50);

    const btnClear = newNode('btnClear', node, -130, -190, 220, 76);
    addLabel(btnClear, '清除存档', 26);
    addButton(btnClear, comp, 'OnClearSave');

    const btnPrivacy = newNode('btnPrivacy', node, 130, -190, 220, 76);
    addLabel(btnPrivacy, '隐私政策', 26);
    addButton(btnPrivacy, comp, 'OnOpenPrivacy');

    const btnClose = newNode('btnClose', node, 310, 235, 60, 60);
    addLabel(btnClose, 'X', 30);
    addButton(btnClose, comp, 'OnClose');

    comp.sliderBGM = bgmNode.getComponent('cc.Slider');
    comp.sliderSfx = sfxNode.getComponent('cc.Slider');
    comp.toggleFilter = toggleNode.getComponent('cc.Toggle');
    node.active = false;
    return node;
}

function buildCustomerTemplate(templates) {
    const node = newNode('Customer', templates, 0, 0, 80, 80);
    node.addComponent('TSCustomer');
    addLabel(node, '客', 30);
    node.active = false;
    return node;
}

function buildAudio(root) {
    const node = newNode('AudioManager', root, 0, 0, 10, 10);
    const comp = node.addComponent('TSAudioManager');
    comp.bgmSource = node.addComponent('cc.AudioSource');
    comp.sfxSource = node.addComponent('cc.AudioSource');
    return node;
}

function buildFilter(root) {
    const node = newNode('Filter', root, 0, 0, 960, 640);
    const comp = node.addComponent('TSFilterController');
    const overlay = newNode('FilterOverlay', node, 0, 0, 960, 640);
    overlay.addComponent('cc.Sprite');
    comp.filterOverlay = overlay;
    return node;
}

function buildCustomerSystem(root, customerTemplate) {
    const node = newNode('CustomerSystem', root, 0, 0, 10, 10);
    const comp = node.addComponent('TSCustomerSystem');
    const custRoot = newNode('customerRoot', node, 0, -40, 800, 420);
    comp.customerRoot = custRoot;
    comp.customerTemplate = customerTemplate;
    return comp;
}

function build() {
    errors = [];

    const scene = cc.director.getScene();
    if (!scene) {
        throw new Error('当前没有已打开的场景，请先新建或打开一个场景');
    }

    let canvasNode = scene.getChildByName('Canvas');
    if (!canvasNode) {
        canvasNode = createDefaultCanvas(scene);
    }

    // 幂等：清理上一次生成结果
    const old = canvasNode.getChildByName('TSRoot');
    if (old) old.destroy();

    const root = newNode('TSRoot', canvasNode, 0, 0, 960, 640);
    const templates = newNode('Templates', root, 0, 0, 10, 10);

    // ---- HUD ----
    try { buildHUD(root); } catch (e) { errors.push('HUD: ' + e.message); }

    // ---- 模板 ----
    let slotTemplate = null;
    let albumItemTemplate = null;
    let customerTemplate = null;
    let offlineTemplate = null;
    let shelfTemplate = null;
    let albumTemplate = null;
    let settingTemplate = null;
    try { offlineTemplate = buildOfflineTemplate(templates); } catch (e) { errors.push('OfflineReward: ' + e.message); }
    try { slotTemplate = buildShelfSlotTemplate(templates); } catch (e) { errors.push('ShelfSlot: ' + e.message); }
    try { shelfTemplate = buildShelfPanelTemplate(templates, slotTemplate); } catch (e) { errors.push('ShelfPanel: ' + e.message); }
    try { albumItemTemplate = buildAlbumItemTemplate(templates); } catch (e) { errors.push('AlbumItem: ' + e.message); }
    try { albumTemplate = buildAlbumPanelTemplate(templates, albumItemTemplate); } catch (e) { errors.push('AlbumPanel: ' + e.message); }
    try { settingTemplate = buildSettingPanelTemplate(templates); } catch (e) { errors.push('SettingPanel: ' + e.message); }
    try { customerTemplate = buildCustomerTemplate(templates); } catch (e) { errors.push('Customer: ' + e.message); }
    templates.active = false;

    // ---- 系统节点 ----
    try { buildAudio(root); } catch (e) { errors.push('AudioManager: ' + e.message); }
    try { buildFilter(root); } catch (e) { errors.push('Filter: ' + e.message); }

    let customerSystem = null;
    try { customerSystem = buildCustomerSystem(root, customerTemplate); } catch (e) { errors.push('CustomerSystem: ' + e.message); }

    // uiRoot 最后创建，保证弹窗渲染在 HUD 之上
    const uiRoot = newNode('uiRoot', root, 0, 0, 960, 640);

    // ---- 入口绑定 ----
    try {
        const gameRoot = root.addComponent('TSGameRoot');
        gameRoot.uiRoot = uiRoot;
        gameRoot.offlinePopupTemplate = offlineTemplate;
        gameRoot.shelfPanelTemplate = shelfTemplate;
        gameRoot.albumPanelTemplate = albumTemplate;
        gameRoot.settingPanelTemplate = settingTemplate;
        gameRoot.customerSystem = customerSystem;
    } catch (e) {
        errors.push('TSGameRoot 绑定失败: ' + e.message);
    }

    const summary = errors.length
        ? '主场景生成完成，但有 ' + errors.length + ' 处警告，详见控制台。'
        : '主场景生成完成。';

    if (errors.length) {
        console.warn('[time-shop-builder] 生成警告：\n' + errors.join('\n'));
    }

    return { summary, errors };
}

function load() { }
function unload() { }

module.exports = { load, unload, methods: { build } };
