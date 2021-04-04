module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'import/prefer-default-export': 0,
    'import/no-default-export': 'error',
    'no-param-reassign': ['error', { props: false }],
    'no-use-before-define': 0,
    'import/extensions': ['error', 'never'],
  },
  settings: {
    'import/resolver': 'webpack',
  },
  ignorePatterns: ['dist'],
};
