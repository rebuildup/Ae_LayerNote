# コントリビュートガイド（概要）

詳しくは `docs/contributing.md` を参照してください。概要のみ下記に抜粋します。

- フォークしてブランチ作成（例: `feat/xxx`）
- ローカルで `yarn validate` を通す（型/リント/テスト）
- 変更点の要約を添えて PR を作成（Draft 可）
- CI が通過したらレビュー依頼

開発の基本コマンド:

```
$ yarn install
$ yarn dev
$ yarn validate
```

PR チェックリスト:
- [ ] `yarn type-check` / `yarn lint:ci` / `yarn test:ci` が通過
- [ ] 影響範囲の説明、スクリーンショット（UI 変更時）
- [ ] 必要があれば `docs/` を更新

