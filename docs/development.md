# 開発ガイド（全体）

このドキュメントは UI/JSX/コアの横断的なセットアップと開発フローをまとめたものです。詳細は README と各ドキュメントを参照してください。

参考:
- Node.js: https://nodejs.org/en/docs
- Yarn (Classic v1): https://classic.yarnpkg.com/en/docs/
- Vite: https://vitejs.dev/guide/
- React: https://react.dev/learn
- TypeScript: https://www.typescriptlang.org/docs/
- Jest: https://jestjs.io/docs
- Testing Library: https://testing-library.com/docs/
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- Adobe CEP: https://github.com/Adobe-CEP/CEP-Resources
- CEP Debugging（PlayerDebugMode など）: https://github.com/Adobe-CEP/CEP-Resources/wiki/Debugging
- After Effects Expressions: https://helpx.adobe.com/jp/after-effects/using/expression-language-reference.html
- After Effects Scripts: https://helpx.adobe.com/jp/after-effects/using/scripts.html

## 必要環境

- Node.js 20 以上
- Yarn v1（このリポジトリは `yarn.lock` を同梱）

## セットアップ

```bash
yarn install
yarn dev
```

After Effects で動作確認する場合は PlayerDebugMode を有効にしてください（上記の Debugging リンク参照）。

## 静的チェック

```bash
yarn type-check   # TypeScript 型チェック
yarn lint         # ESLint（ローカル）
yarn test:watch   # テスト（ローカル）
```

PR を作成する前に最低限 `type-check` と `lint` を通してください。

## ビルド / パッケージ

```bash
yarn build   # CEP 向けビルド
yarn zxp     # ZXP パッケージ作成（配布用）
yarn zip     # ZIP パッケージ作成（サイドカー資産付き）
```

## 主要ディレクトリ

- `src/js/components` … React コンポーネント
- `src/js/contexts` … グローバル状態（Context）
- `src/js/hooks` … カスタムフック
- `src/js/lib` … CEP ブリッジ／ユーティリティ／ストレージ／パフォーマンス関連
- `src/shared` … CEP/ExtendScript 間で共有する型定義
- `src/js/test` … 単体／統合／E2E テスト

