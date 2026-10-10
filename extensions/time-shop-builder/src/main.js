'use strict';

/**
 * TimeShop 场景生成器 —— 主进程脚本
 * 菜单：扩展 -> 生成 TimeShop 主场景
 *
 * 流程：
 *   1. 若不存在则创建 assets/scenes/main.scene（最小可用场景）
 *   2. 打开该场景
 *   3. 调用场景脚本（src/scene.js）在场景内生成 HUD / 面板模板 / 系统节点并完成绑定
 *   4. 保存场景
 */

const EXT_NAME = 'time-shop-builder';
const SCENE_URL = 'db://assets/scenes/main.scene';

// 最小可用场景内容（SceneAsset + Scene + SceneGlobals），用于首次生成场景资源
const MINIMAL_SCENE = [
    {
        __type__: 'cc.SceneAsset',
        _name: 'main',
        _objFlags: 0,
        __editorExtras__: {},
        _native: '',
        scene: { __id__: 1 },
    },
    {
        __type__: 'cc.Scene',
        _name: 'main',
        _objFlags: 0,
        __editorExtras__: {},
        _parent: null,
        _children: [],
        _active: true,
        _components: [],
        _prefab: null,
        _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
        _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
        _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
        _mobility: 0,
        _layer: 1073741824,
        _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
        autoReleaseAssets: false,
        _globals: { __id__: 2 },
        _id: 'scene',
    },
    {
        __type__: 'cc.SceneGlobals',
        ambient: { __id__: 3 },
        skybox: { __id__: 4 },
        fog: { __id__: 5 },
        octree: { __id__: 6 },
        shadows: { __id__: 7 },
        lightProbeInfo: { __id__: 8 },
        postSettings: { __id__: 9 },
        _bakedWithStationaryMainLight: false,
        _bakedWithHighpLightmap: false,
    },
    { __type__: 'cc.AmbientInfo' },
    { __type__: 'cc.SkyboxInfo' },
    { __type__: 'cc.FogInfo' },
    { __type__: 'cc.OctreeInfo' },
    { __type__: 'cc.ShadowsInfo' },
    { __type__: 'cc.LightProbeInfo' },
    { __type__: 'cc.PostSettingsInfo' },
];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function querySceneInfo() {
    try {
        return await Editor.Message.request('asset-db', 'query-asset-info', SCENE_URL);
    } catch (e) {
        return null;
    }
}

function notify(type, message) {
    try {
        if (Editor.Dialog && Editor.Dialog.messageBox) {
            Editor.Dialog.messageBox({ type, title: 'TimeShop 场景生成器', message, buttons: ['好的'] });
        }
    } catch (e) {
        console.log(`[${EXT_NAME}] ${type}: ${message}`);
    }
}

module.exports = {
    load() {
        console.log(`[${EXT_NAME}] 扩展已加载`);
    },

    unload() {
        console.log(`[${EXT_NAME}] 扩展已卸载`);
    },

    methods: {
        async buildScene() {
            try {
                // 1. 确保场景资源存在
                let info = await querySceneInfo();
                if (!info) {
                    console.log(`[${EXT_NAME}] 创建场景资源 ${SCENE_URL}`);
                    await Editor.Message.request('asset-db', 'create-asset', SCENE_URL, JSON.stringify(MINIMAL_SCENE, null, 2));
                    await sleep(1000);
                    info = await querySceneInfo();
                }

                // 2. 打开场景
                if (info && info.uuid) {
                    await Editor.Message.request('scene', 'open-scene', info.uuid);
                    await sleep(1800);
                } else {
                    console.warn(`[${EXT_NAME}] 未找到场景资源，将尝试在当前已打开的场景上生成`);
                }

                // 3. 调用场景脚本生成层级
                const result = await Editor.Message.request('scene', 'execute-scene-script', {
                    name: EXT_NAME,
                    method: 'build',
                    args: [],
                });

                // 4. 保存场景
                await Editor.Message.request('scene', 'save-scene');
                await Editor.Message.request('asset-db', 'refresh-asset', SCENE_URL).catch(() => { });

                console.log(`[${EXT_NAME}] 生成完成`, result);
                const summary = (result && result.summary) ? result.summary : '主场景生成完成';
                notify('info', `${summary}\n\n请点击场景视图空白处或刷新后查看。`);
            } catch (err) {
                const msg = err && err.message ? err.message : String(err);
                console.error(`[${EXT_NAME}] 生成失败`, err);
                notify('error', `生成失败：${msg}`);
            }
        },
    },
};
