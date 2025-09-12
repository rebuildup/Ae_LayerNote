# JSX（ExtendScript）開発ガイド

ExtendScript（AE のスクリプト）は `src/jsx` 配下で管理します。CEP（UI）とはブリッジを介してイベント/データをやり取りします。

参考（公式/関連）:
- Adobe CEP リソース（Cookbook など）: https://github.com/Adobe-CEP/CEP-Resources
- CEP Debugging（PlayerDebugMode など）: https://github.com/Adobe-CEP/CEP-Resources/wiki/Debugging
- After Effects Expressions: https://helpx.adobe.com/jp/after-effects/using/expression-language-reference.html
- After Effects Scripts: https://helpx.adobe.com/jp/after-effects/using/scripts.html

## 構成

- `src/jsx/index.ts` … エントリ
- `src/jsx/aeft/*` … After Effects 向けユーティリティ
- `src/shared/universals.d.ts` … CEP/JSX 間で共有する型

## CEP ↔ JSX 通信

- 型安全なイベント/関数呼び出し
  - CEP 側: `listenTS()`（`src/js/lib/utils/bolt.ts`）
  - JSX 側: `dispatchTS()`（`src/jsx/utils/utils.ts`）
  - 新規イベントは `src/shared/universals.d.ts` の `EventTS` に追記

## ビルド

- Vite 設定 `vite.es.config.ts` により ES3 互換の出力を生成（AE の JSX 互換性のため）
- 出力先: `dist/cep/jsx/index.js`

