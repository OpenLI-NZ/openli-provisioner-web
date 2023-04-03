#!/bin/bash

SPACE=/usr/local/src/openli-provisioner-web

a2dissite openli-provisioner-web
rm /etc/apache2/sites-available/openli-provisioner-web.conf
systemctl reload apache2
systemctl stop openli-provisioner-web
systemctl disable openli-provisioner-web
rm /etc/systemd/system/openli-provisioner-web.service
systemctl daemon-reload

rm -r /etc/openli-provisioner-web
deluser openli-provisioner-web

nvm use 14
if [ -d ${SPACE}/node_modules/\@openli/openli-provisioner-web ]; then
    cd ${SPACE}/node_modules/\@openli/openli-provisioner-web
    make prefix=/usr/local uninstall
fi

if [ -f ${SPACE}/.nvm-installed ]; then
    nvm deactivate
    nvm unload
    sed -i '/NVM_DIR/d' ${HOME}/.bashrc
fi

if [ -d ${SPACE} ]; then
    rm -r ${SPACE}
fi

