# テストガイド

本プロジェクトは Jest + Testing Library を用いたテストを採用しています。

参考:
- Jest: https://jestjs.io/docs
- Testing Library: https://testing-library.com/docs/

## 構成

```
src/js/test/
  ├─ components/   # UI コンポーネント
  ├─ contexts/     # グローバル状態
  ├─ integration/  # 統合テスト
  ├─ e2e/          # 簡易的な E2E
  └─ lib/          # ユーティリティ/ストレージ
```

## 実行

```bash
yarn test:watch      # ローカル開発向け
yarn test:ci         # CI 用（watch 無効）
```

CEP/ファイルシステム依存は基本モック化し、I/O に依存しないユニットとして検証します。

