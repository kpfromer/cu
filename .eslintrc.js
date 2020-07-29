module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    eqeqeq: 'error',
    '@typescript-eslint/explicit-function-return-type': 'off'
  },
  ignorePatterns: ['**/node_modules', '**/lib', '**/build']
};
