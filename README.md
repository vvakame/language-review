# Re:VIEW support for Atom [![Build Status](https://travis-ci.org/vvakame/language-review.svg?branch=master)](https://travis-ci.org/vvakame/language-review)

[Re:VIEW](https://github.com/kmuto/review) is flexible document format/conversion system.
It is used primarily in Japan.

本パッケージはRe:VIEWサポートをAtomに追加するためのものです。
依存しているreview.jsの開発が進むにつれこちらもリッチになっていきます。

まずはyanzmの[Sublime Text 2用プラグイン](https://github.com/yanzm/ReVIEW)を目指したいところです。

## インストール方法

Atomの設定画面で `language-review` と検索してインストールするか、`atom install language-review` を実行してください。

## 開発方法

`apm develop language-review <cloneしたい場所>`としてください。~/.atom/dev/packages/ にシンボリックリンクが張られます。
`atom --debug` で起動することによりcloneしたパッケージを有効にして開発できます。

apm develop を使わないでやろうとすると依存するnode.jsのバージョンではまったりして地獄を見るので注意してください。
それでも頑張る場合、`git clone git@github.com:vvakame/language-review.git ; cd language-review ; apm link ; apm rebuild`とかでいける可能性があります。

ビルドにgruntを使うため、`npm install -g grunt-cli`を実行しておいてください。

初回と、依存関係更新時に`grunt setup`を実行してください。
Atom付属のv0.11系でnode_modulesがビルドされているのでv0.11系のnode.jsで実行するようにしてください。

ビルドには`grunt`を実行してください。

テストには`grunt test`を実行してください。

### 細かいテクニック

普段使いがv0.10系かつnodebrewを使っているかつv0.11系が入っているかつv0.11系で`npm install -g grunt-cli`が行われている場合は`nodebrew exec v0.11 -- grunt setup`でOK。

## ライセンス

本パッケージはMITライセンスで配布しています。

本パッケージはApache License Version 2.0で配布されている[yanzmのSublime Text2用Re:VIEWプラグイン](https://github.com/yanzm/ReVIEW)の成果物(review.tmLanguage)を含みます。
本パッケージはApache License Version 2.0で配布されている[atom-lintパッケージ](https://atom.io/packages/atom-lint)の成果物を真似したものを含みます。
