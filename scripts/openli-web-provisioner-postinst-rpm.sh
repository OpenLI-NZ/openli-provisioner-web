#!/bin/bash

groupadd -f -r openli-provisioner-web || true
useradd -r -g openli-provisioner-web -s /usr/sbin/nologin -M openli-provisioner-web || true
chown -R openli-provisioner-web:openli-provisioner-web /etc/openli-provisioner-web

echo "Re-enabling httpd config, if it had been disabled"
if [ -f /etc/httpd/sites-available/openli-provisioner-web.conf.disabled ]; then
    mv /etc/httpd/sites-available/openli-provisioner-web.conf.disabled \
                /etc/httpd/sites-available/openli-provisioner-web.conf
fi

# TODO test on a VM or container that allows systemctl to run
echo "Starting base services -- may print errors if you are installing"
echo "this in a container, but these can be ignored..."
systemctl daemon-reload || true

systemctl enable openli-provisioner-web || true
systemctl start redis-server || /usr/bin/redis-server /etc/redis/redis.conf --daemonize yes

echo "Configuration files may require editing before starting the web UI"
echo
echo "Look at:"
echo "   /etc/openli-provisioner-web/config.yml "
echo "   /etc/httpd/sites-available/openli-provisioner-web.conf"
echo "   /etc/openli-provisioner-web/gunicorn.py "
echo
echo "Once you're happy with the configuration, you can start the UI service by running: "
echo "    sudo systemctl restart httpd "
echo "    sudo systemctl start openli-provisioner-web "
