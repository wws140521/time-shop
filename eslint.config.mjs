import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        // Cocos Creator 生成目录与依赖无需校验
        ignores: [
            'library/**',
            'temp/**',
            'local/**',
            'build/**',
            'profiles/**',
            'native/**',
            'node_modules/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['assets/scripts/**/*.ts'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                // 微信小游戏全局对象与运行环境全局变量
                wx: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                confirm: 'readonly',
                globalThis: 'readonly',
            },
        },
        rules: {
            // 项目采用「命名空间 + 单例根节点」的模块化架构，允许 namespace
            '@typescript-eslint/no-namespace': 'off',
            // 存档 / 广告 SDK 对接处存在必要的 any
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
    {
        files: ['assets/scripts/**/*.d.ts'],
        rules: {
            // 类型声明文件允许未使用的声明
            '@typescript-eslint/no-unused-vars': 'off',
        },
    }
);
