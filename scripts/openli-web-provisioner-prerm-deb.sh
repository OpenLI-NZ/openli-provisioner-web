#!/bin/bash

echo "Trying to stop services -- may generate error messages if running"
echo "in a container..."
a2dissite openli-provisioner-web
systemctl reload apache2
systemctl stop openli-provisioner-web
systemctl disable openli-provisioner-web
systemctl daemon-reload

sudo -u openli-provisioner-web /usr/bin/openli-web-provisioner-remove.sh
