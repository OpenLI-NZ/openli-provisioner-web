#!/bin/bash

set -e
SPACE=/usr/local/src/openli-provisioner-web

cd ${SPACE}
if ! nvm --version &> /dev/null; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        touch /usr/local/src/openli-provisioner-web/.nvm-installed
fi

nvm install 16
nvm use 16

npm i @openli/openli-provisioner-web
cd node_modules/\@openli/openli-provisioner-web

make pre_build
make build
