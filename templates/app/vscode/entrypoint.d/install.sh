#!/bin/sh
set -eu

cd /root/src
echo "PWD "$PWD

# 安装make,gcc,gdb等，node-gyp无法编译
apt update
apt -y install build-essential

# npm install
echo "Running npm install..."
npm install

#echo "Starting nebula app..."
#npm run $NODE_ENV
