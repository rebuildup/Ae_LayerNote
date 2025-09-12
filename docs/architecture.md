# アーキテクチャ概要（コア/開発者向け）

本プロジェクトは Adobe After Effects 向けの CEP 拡張で、UI は React + TypeScript、ビルドは Vite を採用しています。ExtendScript（JSX）との通信は CEP ブリッジ層で行います。

参考:
- Vite: https://vitejs.dev/guide/
- React: https://react.dev/learn
- TypeScript: https://www.typescriptlang.org/docs/
- Adobe CEP リソース: https://github.com/Adobe-CEP/CEP-Resources
- After Effects Expressions: https://helpx.adobe.com/jp/after-effects/using/expression-language-reference.html

## 主要レイアウト（ハイレベル）

- UI: `src/js/components`（スタイルは `src/js/styles`）
- 状態管理: `src/js/contexts`（アプリ/設定）
- フック: `src/js/hooks`（CEP ブリッジ、レイヤー操作、エディタなど）
- CEP ブリッジ: `src/js/lib/cep-bridge.ts` と `src/js/lib/utils/*`
- 型定義: `src/shared/universals.d.ts`（CEP/JSX 間の型を共有）
- テスト: `src/js/test`（Jest + Testing Library）

## 重要フロー

- プロパティ選択: `PropertySelector` → `useCEPBridge()` 経由で `PropertyInfo` を取得し、選択状態を Context に通知
- エクスプレッション: `expression-formatter` / `expression-linter` / `expression-language` で整形・検証・解析
- ストレージ: `lib/storage/cep-storage.ts` が読み書きを担い、`lib/storage/migration.ts` がマイグレーションを実施

## ビルド

- Vite 設定: `vite.config.ts` / `vite.es.config.ts`
- 出力: `dist/cep` にパネル、`dist/zxp` に ZXP（パッケージ）
- TypeScript 設定: 開発は `tsconfig.json`、ビルドは `tsconfig-build.json`、テストは `tsconfig.test.json`

## コーディングガイド（要点）

- パスエイリアス: `@/*`, `@components/*`, `@contexts/*`, `@lib/*`, `@styles/*`, `@types/*`
- `.d.ts` の型 import は `import type` を推奨
- UI は小さく分割し、ロジックは hooks/helper に集約

