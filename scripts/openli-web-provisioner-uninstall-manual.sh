#!/bin/bash

if [ -f /etc/httpd/conf.d/openli-provisioner-web.conf ]; then
    rm /etc/httpd/conf.d/openli-provisioner-web.conf
elif [ -f /etc/apache2/sites-available/openli-provisioner-web.conf ]; then
    a2dissite openli-provisioner-web
    rm /etc/apache2/sites-available/openli-provisioner-web.conf
fi

SPACE=/usr/local/src/openli-provisioner-web

systemctl reload apache2
systemctl stop openli-provisioner-web
systemctl disable openli-provisioner-web
systemctl daemon-reload

if which deluser > /dev/null; then
    deluser openli-provisioner-web
else
    userdel openli-provisioner-web
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 14
if [ -d ${SPACE}/node_modules/\@openli/openli-provisioner-web ]; then
    cd ${SPACE}/node_modules/\@openli/openli-provisioner-web
    make prefix=/usr/local uninstall
fi

if [ -d ${SPACE} ]; then
    rm -r ${SPACE}
fi

rm -rf /etc/openli-provisioner-web
rm -f /etc/systemd/system/openli-provisioner-web.service

echo
echo "OpenLI provisioner web has been uninstalled, but we've left nvm"
echo "and nodejs on your system in case something else is using them."
echo
echo "If you don't need them anymore and want to clean them up, please"
echo "run the following: "
echo "    nvm deactivate; nvm unload; sed -i '/NVM_DIR/d' ${HOME}/.bashrc"
echo
echo "We've also left the redis service running, just in case you were"
echo "using it for something else as well."
echo
