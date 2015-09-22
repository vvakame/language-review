#!/bin/bash

set -eux

rm -rf node_modules
apm install
grunt setup
grunt
