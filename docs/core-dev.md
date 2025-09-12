# コア開発ガイド（ブリッジ/表現/ストレージ）

ここでは CEP ブリッジ、ストレージ、エクスプレッション処理の概要をまとめます。詳細は `docs/architecture.md` を参照してください。

参考:
- Adobe CEP リソース: https://github.com/Adobe-CEP/CEP-Resources
- Vite: https://vitejs.dev/guide/
- TypeScript: https://www.typescriptlang.org/docs/
- After Effects Expressions: https://helpx.adobe.com/jp/after-effects/using/expression-language-reference.html

## CEP ブリッジ

- 主要ファイル: `src/js/lib/cep-bridge.ts`, `src/js/lib/utils/*`
- 方針: ExtendScript で取得/更新できないものは明示的にハンドリング
- 型: `src/shared/universals.d.ts` に共通型を定義し、CEP/JSX 双方で利用

## ストレージ層

- 主要ファイル: `src/js/lib/storage/cep-storage.ts`, `src/js/lib/storage/migration.ts`
- 役割: CEP 側のローカルファイル/LocalStorage などを抽象化。バージョン変更時のマイグレーションを提供

## エクスプレッション周り

- 主要ファイル: `src/js/lib/expression-*.ts`
- 機能: 整形、検証、検索

## テスト指針

- CEP/FS 依存箇所はモックして（I/O 分離）、ユニットとして検証
- UI テストは Context + Hook + コンポーネントの最小構成で
- CI では型/リントを必須にし、テストは段階導入

