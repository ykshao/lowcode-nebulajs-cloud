#!/bin/sh
set -eu

cd /root/src
echo "PWD "$PWD

echo "Running npm install..."
npm install

#echo "Starting nebula app..."
#npm run $NODE_ENV