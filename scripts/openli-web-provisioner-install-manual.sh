#!/bin/bash

SPACE=/usr/local/src/openli-provisioner-web

mkdir -p ${SPACE}
cd ${SPACE}

if ! nvm --version &> /dev/null; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

nvm install 14
nvm use 14

npm i @openli/openli-provisioner-web
cd node_modules/\@openli/openli-provisioner-web

make pre_build
make build
make prefix=/usr/local install
make clean

mkdir -p /usr/local/lib/openli-provisioner-web/venv

if getent group nogroup > /dev/null; then
        chown nobody:nogroup /usr/local/lib/openli-provisioner-web/venv
else
        chown nobody:nobody /usr/local/lib/openli-provisioner-web/venv
fi

sudo -u nobody make prefix=/usr/local install_venv

if which addgroup > /dev/null; then
    addgroup -q --system openli-provisioner-web || true
else
    groupadd -f -r openli-provisioner-web || true
fi

if which adduser > /dev/null; then
    adduser -q --system --group openli-provisioner-web --shell /usr/sbin/nologin --no-create-home --home /nonexistent
else
    useradd -r -g openli-provisioner-web -s /usr/sbin/nologin -M openli-provisioner-web || true
fi

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
