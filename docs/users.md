# ユーザー向けガイド（After Effects 利用者）

Layer Note は After Effects 用の CEP 拡張です。レイヤーのメモ管理、プロパティ/エクスプレッションの閲覧・編集などを効率化します。

## インストール

1. GitHub Releases から ZXP を取得します。
2. ZXP インストーラー（例: Anastasiy Extension Manager など）でインストールします。
   - 参考（Adobe 公式・CEP 関連）
     - CEP リソース: https://github.com/Adobe-CEP/CEP-Resources
     - Debugging（PlayerDebugMode など）: https://github.com/Adobe-CEP/CEP-Resources/wiki/Debugging

注: PlayerDebugMode を無効にしていても、署名済みの ZXP は利用できます。開発版（`yarn dev` やローカルビルド）を利用する場合は PlayerDebugMode を有効化してください。

## 使い方（サマリ）

- レイヤー一覧から対象レイヤーを選ぶと、該当プロパティやコメントを編集できます。
- プロパティを選ぶと、右側のエディタでエクスプレッションの編集・整形・検証が可能です。
- コメントはプロジェクト内に保存され、後から再編集できます。

## 参考リンク

- After Effects Expressions リファレンス: https://helpx.adobe.com/jp/after-effects/using/expression-language-reference.html
- After Effects Scripts（スクリプト）: https://helpx.adobe.com/jp/after-effects/using/scripts.html

