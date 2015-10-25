#!/bin/bash

set -eux

rm -rf node_modules

# apm on Node.js v0.10, can't install devDependencies
# If https://github.com/atom/apm/pull/449 released, when We should use simply `apm install`.
apm install --production
npm install
apm rebuild

grunt setup
grunt
