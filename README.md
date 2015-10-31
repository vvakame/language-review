# Re:VIEW support for Atom [![Build Status](https://travis-ci.org/vvakame/language-review.svg?branch=master)](https://travis-ci.org/vvakame/language-review)

[Re:VIEW](https://github.com/kmuto/review) is flexible document format/conversion system.
It is used primarily in Japan.

本パッケージはRe:VIEWサポートをAtomに追加するためのものです。
依存しているreview.jsの開発が進むにつれこちらもリッチになっていきます。

## 利用方法

### インストール方法

Atomの設定画面で `language-review` と検索してインストールするか、`apm install language-review` を実行してください。

簡単にAtomやlanguage-reviewをインストールするためのスクリプトも用意しておきました。
Mac環境でのみ動作を確認しています。

```
$ curl -L https://github.com/vvakame/language-review/raw/master/install.sh | bash
```

### .reファイルの編集

`.re` ファイルを編集する時に、grammarをRe:VIEWに設定してください。

![grammarの設定](https://raw.githubusercontent.com/vvakame/language-review/master/docs/grammar-status.png)

### 機能の呼び出し

language-reviewには `.re` ファイルの編集支援の他に、いくつかの機能があります。

![機能の呼び出し](https://raw.githubusercontent.com/vvakame/language-review/master/docs/package-menu.png)

`Toggle Preview` は現在開いている `.re` ファイルのプレビューを表示します。
review.jsによりコンパイルし表示し、独自のCSSを当てているため、実際に出力する際には大きな差異が発生するでしょう。
文法が正しいかを確かめたり、文章の分量調整などの参考程度に使ってください。

`Toggle Outline` は現在開いている `.re` ファイルのアウトラインを表示します。
好きな見出しを選んでジャンプすることもできます。

`Toggle Syntax List` はreview.jsがサポートする構文の一覧が表示されます。
これ以外の資料として、[Re:VIEWのフォーマットガイド](https://github.com/kmuto/review/blob/master/doc/format.ja.md)などを利用してください。

### 校正機能の利用

language-reviewには[prh](https://github.com/vvakame/prh#proofread-helper-)が組み込まれています。
`.re` ファイルと同じディレクトリに[設定ファイル](https://github.com/vvakame/prh/tree/master/misc)を `prh.yml` という名前で配置してください。
`.re` ファイルの編集時にルールにしたがって修正案を表示してくれます。

![修正の提案](https://raw.githubusercontent.com/vvakame/language-review/master/docs/prh-warning.png)

## 開発方法

```
$ git clone git@github.com:vvakame/language-review.git
$ cd language-review
$ apm link --dev .
$ apm links
# 全く同じ表示にはならないが同じようなニュアンスだったらOK
~/.atom/dev/packages (1)
└── language-review -> ${pwd}
~/.atom/packages (0)
└── (no links)
$ ./setup.sh
# 依存関係が解決される
$ atom --dev .
# 適当に開発する
```

ビルドにgruntを使うため、`npm install -g grunt-cli`を実行しておいてください。

ビルドには`grunt`を実行してください。

テストには`grunt test`を実行してください。

デバッグログを出力するにはPackageの設定でDebugオプションをONにしてください。

![DebugをONに](https://raw.githubusercontent.com/vvakame/language-review/master/docs/debug-option.png)

## ライセンス

本パッケージはMITライセンスで配布しています。

本パッケージはApache License Version 2.0で配布されている[yanzmのSublime Text2用Re:VIEWプラグイン](https://github.com/yanzm/ReVIEW)の成果物(review.tmLanguage)を含みます。
本パッケージはApache License Version 2.0で配布されている[atom-lintパッケージ](https://atom.io/packages/atom-lint)の成果物を真似したものを含みます。
