#!/bin/bash

SPACE=/usr/local/src/openli-provisioner-web

rm /etc/httpd/conf.d/openli-provisioner-web.conf

echo "Trying to stop services -- may generate error messages if running"
echo "in a container..."
systemctl reload apache2
systemctl stop openli-provisioner-web
systemctl disable openli-provisioner-web
systemctl daemon-reload

echo "Removing react app from ${SPACE}..."

if [ -d ${SPACE}/node_modules/\@openli/openli-provisioner-web ]; then
    cd ${SPACE}/node_modules/\@openli/openli-provisioner-web
    make prefix=/usr/local uninstall
fi

rm -rf /etc/openli-provisioner-web
rm /etc/systemd/system/openli-provisioner-web.service

userdel -r openli-provisioner-web

echo "We've left the redis service running, just in case you were"
echo "using it for something else as well."
echo
echo "If you don't need redis any more, you should probably remove it"
echo "by running: "
echo "    yum remove redis "
echo
