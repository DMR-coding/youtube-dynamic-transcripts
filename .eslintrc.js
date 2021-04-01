module.exports = { // noqa , ironically
  env: {
    browser: true,
    es2021: true,
    'googleappsscript/googleappsscript': true,
    jquery: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
  },
  globals: {
    $: 'readonly',
    YT: 'readonly'
  },
  plugins: [
    'googleappsscript'
  ]
}
