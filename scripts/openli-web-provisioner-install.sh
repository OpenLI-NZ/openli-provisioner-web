#!/bin/bash

SPACE=/usr/local/src/openli-provisioner-web

mkdir -p ${SPACE}
cd ${SPACE}

if ! nvm --version &> /dev/null; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        touch /usr/local/src/openli-provisioner-web/.nvm-installed
fi

nvm install 14
nvm use 14

npm i @openli/openli-provisioner-web
cd node_modules/\@openli/openli-provisioner-web

make pre_build
make build
make prefix=/usr/local install
mkdir -p /usr/local/lib/openli-provisioner-web/venv
chown nobody:nogroup /usr/local/lib/openli-provisioner-web/venv
sudo -u nobody make prefix=/usr/local install_venv
make clean

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

addgroup -q --system openli-provisioner-web || true
adduser -q --system --group openli-provisioner-web --shell /usr/sbin/nologin --no-create-home --home /nonexistent || true
chown --recursive openli-provisioner-web:openli-provisioner-web /etc/openli-provisioner-web

if [ ! -f /etc/systemd/system/openli-provisioner-web.service ]; then
    cp contrib/example.service /etc/systemd/system/openli-provisioner-web.service
fi
systemctl daemon-reload

systemctl enable openli-provisioner-web
systemctl start redis-server

if [ ! -f /etc/apache2/sites-available/openli-provisioner-web.conf ]; then
    cp contrib/apache.conf /etc/apache2/sites-available/openli-provisioner-web.conf
fi

a2enmod ssl proxy proxy_http headers
a2ensite openli-provisioner-web

echo "Configuration files may require editing before starting the web UI"
echo
echo "Look at:"
echo "   /etc/openli-provisioner-web/config.yml "
echo "   /etc/apache2/sites-available/openli-provisioner-web.conf"
echo "   /etc/openli-provisioner-web/gunicorn.py "
echo
echo "Once you're happy with the configuration, you can start the UI service by running: "
echo "    sudo systemctl restart apache2 "
echo "    sudo systemctl start openli-provisioner-web "

