# Layer Note（After Effects 用 CEP 拡張）

Layer Note は After Effects 向けの CEP 拡張です。レイヤーのメモ管理、プロパティ/エクスプレッションの閲覧・編集、検索、フォーマットなどを効率化します。

- ビルド: Vite
- UI: React + TypeScript
- ExtendScript: 型安全なブリッジ（evalTS / listenTS）

## クイックスタート

```bash
yarn install
yarn dev
```

ZXP の作成（配布用）:

```bash
yarn zxp
```

## ドキュメント

- ユーザー向け: `docs/users.md`
- UI 開発（React/TS）: `docs/ui-dev.md`
- JSX 開発（ExtendScript）: `docs/jsx-dev.md`
- コア開発（ブリッジ/表現/ストレージ）: `docs/core-dev.md`
- 開発ガイド（セットアップ/ビルド）: `docs/development.md`
- テストガイド: `docs/testing.md`
- コントリビュートガイド: `docs/contributing.md`
- ポリシー（CoC/セキュリティ）: `docs/policies/`

## 参考リンク

- Vite: https://vitejs.dev/guide/
- React: https://react.dev/learn
- TypeScript: https://www.typescriptlang.org/docs/
- Adobe CEP リソース: https://github.com/Adobe-CEP/CEP-Resources
- CEP Debugging（PlayerDebugMode など）: https://github.com/Adobe-CEP/CEP-Resources/wiki/Debugging
- After Effects Expressions: https://helpx.adobe.com/jp/after-effects/using/expression-language-reference.html
- After Effects Scripts: https://helpx.adobe.com/jp/after-effects/using/scripts.html

## プロジェクトテンプレートについて

本プロジェクトは Bolt CEP をベースにしています。詳細と最新情報:

- Bolt CEP: https://github.com/hyperbrew/bolt-cep

## Compatibility

- Adobe CC 2024+（After Effects）
- Windows / macOS Intel
- macOS Apple Silicon（必要に応じてセットアップ参照）

## PlayerDebugMode の有効化（開発時）

- インストール済み ZXP は不要ですが、`yarn build`/`yarn dev` の動作確認には PlayerDebugMode を有効化してください。
- 簡単な方法: [aescripts ZXP Installer](https://aescripts.com/learn/zxp-installer/) の設定から Debug を有効化
- マニュアル手順: [CEP Cookbook](https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_12.x/Documentation/CEP%2012%20HTML%20Extension%20Cookbook.md#debugging-unsigned-extensions)

## GitHub Actions ZXP Releases

git タグを push すると、ZXP をビルドして Release に追加します。

```
git tag 1.0.0
git push origin --tags
```

詳細は `.github/workflows/main.yml` を参照してください。
