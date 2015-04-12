#!/bin/bash

set -eux

rm -rf bower-task bower_components node_modules
apm install
grunt setup
grunt
