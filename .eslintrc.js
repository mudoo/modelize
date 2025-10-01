// http://eslint.org/docs/user-guide/configuring
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    sourceType: 'module',
  },
  extends: ['standard', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended'],
  globals: {
    NAME: true,
    VERSION: true,
  },
  rules: {
    semi: 'warn',
    'no-new': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    'spaced-comment': ['error', 'always', {
      line: {
        markers: ['/'],
        exceptions: ['-', '+', '/'],
      },
    }],
    'no-multi-spaces': ['error', { ignoreEOLComments: true }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
