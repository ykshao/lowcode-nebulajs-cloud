#!/bin/sh
set -eu

cd /root/src
echo "PWD "$PWD

####################### SQLite环境支持 Start #######################
# 安装make,gcc,gdb等，node-gyp无法编译
apt update
apt -y install build-essential
####################### SQLite环境支持 End #######################

# npm install
echo "Running npm install..."
npm install

#echo "Starting nebula app..."
#npm run $NODE_ENV
