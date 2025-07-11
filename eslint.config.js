import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginVue from 'eslint-plugin-vue';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
  [{
    ignores: ['node_modules', 'dist', 'public'],
  },
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: true,
    braceStyle: '1tbs',
    arrowParens: 'always',
  }),

  /**
         * javascript 规则
         */
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    rules: {
      'no-console': 'error',
    },
  },
  /** js推荐配置 */
  eslint.configs.recommended,
  /** ts推荐配置 */
  ...tseslint.configs.recommended,
  /** vue推荐配置 */
  ...eslintPluginVue.configs['flat/recommended'],
  /**
         * 配置全局变量
         */
  {
    languageOptions: {
      globals: {
        ...globals.browser,

        /** 追加一些其他自定义全局规则 */
        wx: true,
      },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        /** typescript项目需要用到这个 */
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        /** 允许在.vue 文件中使用 JSX */
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // 在这里追加 vue 规则
      'vue/max-attributes-per-line': ['error', {
        singleline: {
          max: 2,
        },
        multiline: {
          max: 1,
        },
      }],
      'vue/no-mutating-props': [
        'error',
        {
          shallowOnly: true,
        },
      ],

      'vue/multi-word-component-names': 0,
    },
  },
  /**
         * typescript 规则
         */
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {},
  },
  ],
);
