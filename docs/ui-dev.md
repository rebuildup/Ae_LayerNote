# UI 開発ガイド（React/TypeScript）

UI は React + TypeScript + Vite で構築しています。Monaco Editor や lucide-react などを利用しています。

参考:
- React: https://react.dev/learn
- TypeScript: https://www.typescriptlang.org/docs/
- Vite: https://vitejs.dev/guide/
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- Testing Library: https://testing-library.com/docs/
- Jest: https://jestjs.io/docs

## セットアップ

```bash
yarn install
yarn dev
```

## コードの場所

- コンポーネント: `src/js/components`
- グローバル状態（Context）: `src/js/contexts`
- カスタムフック: `src/js/hooks`
- スタイル: `src/js/styles`

## パスエイリアス

- `@/*`, `@components/*`, `@contexts/*`, `@lib/*`, `@styles/*`, `@types/*`（`tsconfig.json` を参照）

## コーディング指針

- 型は可能な限り `import type` を利用し、型のみの import にする
- コンポーネントは小さく保ち、ビジネスロジックは hook/helper に切り出す
- ESLint は段階的に導入中です。`yarn lint` で確認できます

## テスト

- `src/js/test` に unit/integration/E2E テストがあります
- ローカルでは `yarn test:watch` を利用してください（CI では unit のみ実行）

