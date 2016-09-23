#!/bin/bash

set -eux

rm -rf node_modules

apm install

npm run build

curl -L https://github.com/vvakame/prh/raw/master/misc/techbooster.yml > example/prh.yml
