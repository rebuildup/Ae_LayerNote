module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tsconfig.test.json'],
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
  ],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      // If you add `eslint-import-resolver-typescript`, you can enable this:
      // typescript: { project: ['./tsconfig.json'] },
    },
  },
  rules: {
    // React 17+ and modern JSX runtimes do not require React in scope
    'react/react-in-jsx-scope': 'off',
    // Keep consoles for diagnostics; escalate other types
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    // Turn off unresolved until TS path resolver is added
    'import/no-unresolved': 'off',
    'import/named': 'off',
    // Not using PropTypes with TS
    'react/prop-types': 'off',
    // Relax some a11y rules during early development
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/no-noninteractive-tabindex': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',
    // Pragmatic defaults for a green CI while refactoring
    'prefer-const': 'warn',
    'no-var': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react/no-unescaped-entities': 'off',
  },
  overrides: [
    {
      files: ['src/js/test/**/*', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        'no-var': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },
  ],
};
