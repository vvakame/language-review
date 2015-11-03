#! /bin/bash -eu

if [ "$(uname)" == 'Darwin' ]; then
  OS='Mac'
else
  echo "Your platform ($(uname -a)) is not supported. please send a pull request!"
  exit 1
fi

which apm > /dev/null 2>&1
if [ $? -ne 0 ] ; then
  temp=$(mktemp -d -t atom)
  cd $temp
  curl -L https://atom.io/download/mac --output atom.zip
  unzip atom.zip -d /Applications

  # 1回Atomを起動するとatom, apm両コマンドがパス上に配置される
  open /Applications/Atom.app && sleep 10
fi

apm install linter language-review
open https://atom.io/packages/language-review

echo ""
echo "気に入ったらぜひStarをつけてくださいね！ apm star language-review でもOK"
