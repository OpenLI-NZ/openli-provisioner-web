#!/bin/bash

mkdir -p /usr/local/lib/openli-provisioner-web/venv
chown nobody:nobody /usr/local/lib/openli-provisioner-web/venv
sudo -u nobody make prefix=/usr/local install_venv

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

if [ ! -f /etc/systemd/system/openli-provisioner-web.service ]; then
    cp contrib/openli-provisioner-web.service /etc/systemd/system/openli-provisioner-web.service
fi

if [ ! -f /etc/httpd/conf.d/openli-provisioner-web.conf ]; then
    cp contrib/apache2/openli-provisioner-web.conf /etc/httpd/conf.d/openli-provisioner-web.conf
fi

groupadd -f -r openli-provisioner-web || true
useradd -r -g openli-provisioner-web -s /usr/sbin/nologin -M openli-provisioner-web || true
chown -R openli-provisioner-web:openli-provisioner-web /etc/openli-provisioner-web

# TODO test on a VM or container that allows systemctl to run
echo "Starting base services -- may print errors if you are installing"
echo "this in a container, but these can be ignored..."
systemctl daemon-reload || true

systemctl enable openli-provisioner-web || true
systemctl start redis-server || /usr/libexec/redis-shutdown; /usr/bin/redis-server /etc/redis/redis.conf --daemonize yes

echo "Configuration files may require editing before starting the web UI"
echo
echo "Look at:"
echo "   /etc/openli-provisioner-web/config.yml "
echo "   /etc/httpd/conf.d/openli-provisioner-web.conf"
echo "   /etc/openli-provisioner-web/gunicorn.py "
echo
echo "Once you're happy with the configuration, you can start the UI service by running: "
echo "    sudo systemctl restart httpd "
echo "    sudo systemctl start openli-provisioner-web "
