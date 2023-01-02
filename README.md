# 楽天市場の領収書一括 DL ツール

楽天市場の購入履歴から、請求書を一括でダウンロードします。

# 注意点

- 一度発行すると次回以降（再発行）の表示になりますので、気にされる方は気をつけて
- 2021 年以降のみ DL します
- 悪用厳禁

# 環境

- node v18.2.0

# 実行方法

## Credential 情報の記入

`src/env.example.ts` に楽天市場にログインする ID / PASS を入力して下さい。

## ライブラリインストール

```
yarn install
```

## 実行

```
yarn start
```

約 150 枚で 40 分くらいかかります。  
気長にお待ち下さい。

# エラーで止まる

```
ProtocolError: Protocol error (Fetch.continueRequest): Invalid InterceptionId.
```

で止まることあり。  
よく止まる。

その他まだいろいろ止まることあるかも。

# 作成・連絡先

たなまちけんた  
[@kenta_dr_99](https://twitter.com/kenta_dr_99/)
