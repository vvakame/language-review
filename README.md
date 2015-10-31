# Re:VIEW support for Atom [![Build Status](https://travis-ci.org/vvakame/language-review.svg?branch=master)](https://travis-ci.org/vvakame/language-review)

[Re:VIEW](https://github.com/kmuto/review) is flexible document format/conversion system.
It is used primarily in Japan.

本パッケージはRe:VIEWサポートをAtomに追加するためのものです。
依存しているreview.jsの開発が進むにつれこちらもリッチになっていきます。

## インストール方法

Atomの設定画面で `language-review` と検索してインストールするか、`apm install language-review` を実行してください。

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

## ライセンス

本パッケージはMITライセンスで配布しています。

本パッケージはApache License Version 2.0で配布されている[yanzmのSublime Text2用Re:VIEWプラグイン](https://github.com/yanzm/ReVIEW)の成果物(review.tmLanguage)を含みます。
本パッケージはApache License Version 2.0で配布されている[atom-lintパッケージ](https://atom.io/packages/atom-lint)の成果物を真似したものを含みます。
