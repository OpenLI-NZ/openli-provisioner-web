#!/bin/bash

chown --recursive openli-provisioner-web:openli-provisioner-web /etc/openli-provisioner-web

echo "Starting base services -- may print errors if you are installing"
echo "this in a container, but these can be ignored..."
systemctl daemon-reload

systemctl enable openli-provisioner-web
systemctl start redis-server || /usr/libexec/redis-shutdown; /usr/bin/redis-server /etc/redis/redis.conf --daemonize yes

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
echo "    sudo systemctl restart openli-provisioner-web "
