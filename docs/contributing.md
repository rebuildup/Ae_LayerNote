# コントリビュートガイド

このリポジトリは「フォークして PR を送る」運用を前提にしています。小人数でもレビューが回るよう、以下の流れとルールに従ってください。

## 参加手順

1. リポジトリをフォーク
2. `main` からトピックブランチを作成（例: `feat/selection-keyboard-nav`）
3. ローカルで動作確認・テスト
4. 変更点の要約を添えて PR を作成（Draft から始めてもOK）

## セットアップ（最小）

```bash
yarn install
yarn dev
```

開発モードで After Effects から確認する場合は PlayerDebugMode を有効化してください。

## よく使うコマンド

- `yarn type-check` … TypeScript 型チェック
- `yarn lint` … ESLint（ローカルは警告許容、CI は厳格）
- `yarn test:watch` … テスト（ローカル）
- `yarn validate` … 型/リント/テストをまとめて実行

## コーディング規約

- `import type` を活用し、型と値の import を分離
- コンポーネントは関心ごとで分割し、ロジックは hook/helper へ
- 可能ならばテストを同時に追加（ユニット or コンポーネント）

## PR チェックリスト

- テスト・型チェック・リントを通す（CI では `yarn lint:ci` を実行）
- 影響範囲の説明、スクリーンショットや動画（UI 変更時）
- 関連するドキュメントの更新（`docs/` or README）

## セキュリティ

脆弱性の疑いは Issue ではなく、GitHub の「Private vulnerability reporting」など非公開手段で連絡してください。

