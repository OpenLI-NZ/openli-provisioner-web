#!/bin/bash

SPACE=/usr/local/src/openli-provisioner-web

if which addgroup > /dev/null; then
    addgroup -q --system openli-provisioner-web || true
else
    groupadd -f -r openli-provisioner-web || true
fi

useradd -r -m -g openli-provisioner-web openli-provisioner-web || true

mkdir -p ${SPACE}
chown openli-provisioner-web:openli-provisioner-web ${SPACE}

mkdir -p /usr/local/lib/openli-provisioner-web/venv
chown openli-provisioner-web:openli-provisioner-web /usr/local/lib/openli-provisioner-web/venv

sudo -u openli-provisioner-web /usr/bin/openli-web-provisioner-npm.sh

cd ${SPACE}/node_modules/\@openli/openli-provisioner-web

make prefix=/usr/local install
make clean
make prefix=/usr/local install_venv

mkdir -p -m 700 /etc/openli-provisioner-web


if [ ! -f /etc/openli-provisioner-web/config.yml ]; then
    cp openli_provisioner_web/config/config.yml /etc/openli-provisioner-web/config.yml
    chmod u=rw,g=,o= /etc/openli-provisioner-web/config.yml
fi

if [ ! -f /etc/openli-provisioner-web/gunicorn.py ]; then
    cp contrib/gunicorn.py /etc/openli-provisioner-web/gunicorn.py
fi

if [ ! -f /etc/openli-provisioner-web/service.env ]; then
    cp contrib/service.env /etc/openli-provisioner-web/service.env
fi

chown -R openli-provisioner-web:openli-provisioner-web /etc/openli-provisioner-web

if [ ! -d /etc/systemd/system ]; then
    echo "Unable to install service file to /etc/systemd/system..."
    echo "Please ensure systemd is installed on your system and try again."
    exit 1
else
    if [ ! -f /etc/systemd/system/openli-provisioner-web.service ]; then
        cp contrib/openli-provisioner-web.service /etc/systemd/system/openli-provisioner-web.service
    fi
    systemctl daemon-reload
    systemctl enable openli-provisioner-web
fi

if which a2enmod > /dev/null; then
    a2enmod ssl proxy proxy_http headers
fi

echo "Configuration files may require editing before starting the web UI"
echo
echo "Look at:"
echo "   /etc/openli-provisioner-web/config.yml "
echo "   /etc/openli-provisioner-web/gunicorn.py "
echo
echo "You will also need to add configuration for the UI site to your web"
echo "server."
echo
echo "If you are running apache/httpd as your web server, we've provided some"
echo "example config in contrib/apache2/openli-provisioner-web.conf that you "
echo "can edit and then place in the appropriate directory."
echo
echo "Once your configuration is all correct, you will need to start your "
echo "web server service. "
echo
echo "Then you can start the openli-provisioner-web application by running: "
echo "   sudo systemctl start openli-provisioner-web "
