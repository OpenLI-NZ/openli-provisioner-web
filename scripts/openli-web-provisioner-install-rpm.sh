#!/bin/bash

groupadd -f -r openli-provisioner-web || true
useradd -r -m -g openli-provisioner-web openli-provisioner-web || true

SPACE=/usr/local/src/openli-provisioner-web

mkdir -p ${SPACE}
chown openli-provisioner-web:openli-provisioner-web ${SPACE}

mkdir -p /usr/local/lib/openli-provisioner-web/venv
chown openli-provisioner-web:openli-provisioner-web /usr/local/lib/openli-provisioner-web/venv

sudo -u openli-provisioner-web /usr/bin/openli-web-provisioner-npm.sh

cd ${SPACE}/node_modules/\@openli/openli-provisioner-web
make prefix=/usr/local install
make clean
make prefix=/usr/local install_venv
