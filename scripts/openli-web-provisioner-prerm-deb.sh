#!/bin/bash

SPACE=/usr/local/src/openli-provisioner-web

echo "Trying to stop services -- may generate error messages if running"
echo "in a container..."
a2dissite openli-provisioner-web
systemctl reload apache2
systemctl stop openli-provisioner-web
systemctl disable openli-provisioner-web
systemctl daemon-reload

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 14
if [ -d ${SPACE}/node_modules/\@openli/openli-provisioner-web ]; then
    cd ${SPACE}/node_modules/\@openli/openli-provisioner-web
    make prefix=/usr/local uninstall
fi
