#!/bin/bash

SPACE=/usr/local/src/openli-provisioner-web

mkdir -p ${SPACE}
cd ${SPACE}

if ! nvm --version &> /dev/null; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        touch /usr/local/src/openli-provisioner-web/.nvm-installed
fi

nvm install 14
nvm use 14

npm i @openli/openli-provisioner-web
cd node_modules/\@openli/openli-provisioner-web

make pre_build
make build
make prefix=/usr/local install
make clean

mkdir -p /usr/local/lib/openli-provisioner-web/venv
chown nobody:nogroup /usr/local/lib/openli-provisioner-web/venv
sudo -u nobody make prefix=/usr/local install_venv
