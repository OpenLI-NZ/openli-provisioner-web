# OpenLI Provisioner Web Interface

Web interface for the OpenLI provisioner.

## Installation

For more details on how to install and configure this software, please
go to the wiki page at
https://github.com/OpenLI-NZ/openli/wiki/OpenLI-Provisioner-Web-UI

### Manual install

1. Install requirements:
    * python >= 3.6
    * python3-venv
    * redis-server
    * systemd
    * curl
    * make
    * sudo
    * apache2 (optional)

2. Clone the github repository and change into the cloned directory:
    ```bash
    git clone https://github.com/OpenLI-NZ/openli-provisioner-web.git
    cd openli-provisioner-web
    ```

3. Use the provided install script:
    ```bash
    sudo ./scripts/openli-web-provisioner-install-manual.sh
    ```

4. Configure `config.yml` (see [Configuration file](#configuration-file))
   and `gunicorn.py` under `/etc/openli-provisioner-web`.
   It is recommended to set `workers` in `gunicorn.py`
   to the number of logical threads in your system + 1.
   > ***Note:*** In production, it is highly recommended
   to configure a password for the redis server.

5. Start systemd service:
    ```bash
    sudo systemctl enable openli-provisioner-web
    sudo systemctl start openli-provisioner-web
    sudo systemctl restart redis-server
    ```

6. Configure web server
   (In this example we use apache2 for Debian/Ubuntu,
   but you can use any web server application
   with a similar configuration):
    ```bash
    sudo cp contrib/apache.conf /etc/apache2/sites-available/openli-provisioner-web.conf
    ```
    > ***Note:*** Make sure to edit the apache site configuration to set the
    appropriate values for hostnames, listening ports and SSL certificates.
    ```bash
    sudo a2ensite openli-provisioner-web
    sudo systemctl restart apache2
    ```


### Uninstall

```bash
./scripts/openli-provisioner-web-uninstall-manual.sh
```

## Configuration file

Configuration is provided by a YAML file located at either:
* Path provided by the `OPENLI_PROVISIONER_WEB_CONFIG_FILE` environment variable.
* `<installation directory>/openli_provisioner_web/config/config.yml`

| Variable | Type | Required | Default | Description |
| -------- | ---- | -------- | ------- | ----------- |
| `site_title` | string | `false` | | Title to display for the web interface instance. |
| `api_url` | string | `false` | `http://localhost:8992` | URL for the OpenLI intercept configuration REST API. |
| `api_auth_enabled` | boolean | `false` | `true` | Set to `true` if the REST API authentication is enabled. |
| `log_level` | string | `false` | `INFO` | Log level for output to stdout/stderr. Choices: ERROR, WARNING, INFO, DEBUG. |
| `redis_host` | string | `false` | `localhost` | Redis database hostname or IP address (when `api_auth_enabled: true`) |
| `redis_port` | integer | `false` | `6379` | Redis database port (when `api_auth_enabled: true`) |
| `redis_db` | integer | `false` | `0` | Redis database ID (when `api_auth_enabled: true`) |
| `redis_password` | string | `false` | | Redis database password (when `api_auth_enabled: true`) |
| `session_cookie_domain` | string | `true` when `api_auth_enabled: true` | | Domain for the session cookie (when `api_auth_enabled: true`). This should be set to the server name of the web server. |
| `session_cookie_path` | string | `false` | `/` | Path for the session cookie (when `api_auth_enabled: true`). |
| `session_cookie_secure` | boolean | `false` | `false` | If `true`, require secure connections (when `api_auth_enabled: true`). It is recommended to set this to `true` in production. |
| `session_lifetime_seconds` | integer | `false` | `3600` (1 hour) | Session lifetime in seconds (when `api_auth_enabled: true`). |
| `session_cookie_signing_key` | string | `true` when `api_auth_enabled: true` | | A secure random string for signing session cookies with (when `api_auth_enabled: true`). It is recommended to provide a string of length 40. The minimum required length is 20 to provide a good level of security. |

> ***Note:*** Redis and session configuration is only used when API authentication is required.

## Environment varables
| Variable | Description |
| -------- | ----------- |
| `OPENLI_PROVISIONER_WEB_DEBUG` | If `true`, start in debug mode. |
| `OPENLI_PROVISIONER_WEB_CONFIG_FILE` | Path to main configuation file. |
| `OPENLI_PROVISIONER_WEB_API_FILE` | Path to API definition file. |
| `OPENLI_PROVISIONER_WEB_ROUTES_FILE` | Path to routes configuration file. |

## Development

### Requirements

* nodejs >= 14.0.0
  > ***Note:*** If newer versions are not available on your
  distribution, install nodejs via
  https://nodejs.org/en/download/package-manager/
* python >= 3.6
* python3-venv
* redis-server

### Build from source

```bash
# Replace <project directory> with the directory you cloned the repository to
cd <project directory>
npm install
BUILD_PATH=openli_provisioner_web/build npm run build
```

### Run development server

1. [Build from source](#build-from-source)
2. Create a configuration file and make sure to set
   `session_cookie_domain` to `localhost.localdomain`
3. ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   # Replace <path to config file> with the path to your configuration file
   OPENLI_PROVISIONER_WEB_CONFIG_FILE="<path to config file>" flask --app openli_provisioner_web run
    ```
4. Goto http://localhost.localdomain:5000
