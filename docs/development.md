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

### After Effects 用シンボリックリンク（重要）

- **`yarn dev` はシンボリックリンクを作成しません。** After Effects に拡張機能を表示するには、CEP 拡張の配置先（Adobe CEP Extensions フォルダ）へシンボリックリンクを作成する必要があります。
- シンボリックリンクは以下のコマンドで作成/削除できます（初回セットアップ時に一度実行してください）。

```bash
yarn symlink     # CEP 拡張のシンボリックリンクを作成
yarn delsymlink  # シンボリックリンクを削除
```

- その後は:
  - 開発中は `yarn dev` で Vite 開発サーバを起動（AE 上に同名パネルが表示され、更新が反映されます）。
  - 単体で成果物を確認したい場合は `yarn build` で `dist/cep` にビルドが出力されますが、**ビルドだけではシンボリックリンクは作成されません**。AE から見えるようにするには、前述の `yarn symlink` が必要です。

補足: システムの CEP Extensions パスは OS/バージョンにより異なります。一般的には次のいずれかです（参考）。

- Windows: `%APPDATA%/Adobe/CEP/extensions` または `C:/Program Files (x86)/Common Files/Adobe/CEP/extensions`
- macOS: `~/Library/Application Support/Adobe/CEP/extensions` または `/Library/Application Support/Adobe/CEP/extensions`

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
