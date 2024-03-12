#!/bin/bash

echo "Trying to stop services -- may generate error messages if running"
echo "in a container..."
a2dissite openli-provisioner-web
systemctl reload apache2
systemctl stop openli-provisioner-web
systemctl disable openli-provisioner-web
systemctl daemon-reload

SPACE=/usr/local/src/openli-provisioner-web

if [ -d ${SPACE}/node_modules/\@openli/openli-provisioner-web ]; then
    cd ${SPACE}/node_modules/\@openli/openli-provisioner-web
    make prefix=/usr/local uninstall
fi
