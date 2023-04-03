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

if [ -d ${SPACE} ]; then
    rm -r ${SPACE}
fi

echo
echo "OpenLI provisioner web has been uninstalled, but we've left nvm"
echo "and nodejs on your system in case something else is using them."
echo
echo "If you don't need them anymore and want to clean them up, please"
echo "run the following: "
echo "    nvm deactivate; nvm unload; sed -i '/NVM_DIR/d' ${HOME}/.bashrc"
echo
