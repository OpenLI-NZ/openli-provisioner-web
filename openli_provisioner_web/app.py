"""OpenLI provisioner web flask app"""

# OpenLI Provisioner Web Interface
# Copyright (C) 2023 The University of Waikato, Hamilton, New Zealand. All rights reserved.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import os
import traceback

import openli_provisioner_web
from openli_provisioner_web.config import load_config, load_api, load_routes, ConfigFormatError, ConfigLoadError
from openli_provisioner_web.logger import Logger, LogLevel
from openli_provisioner_web.auth import HTTPAPIKeyAuth, HTTPDigestAuthHA1

from flask import Flask, Response, request, session, send_from_directory, jsonify
from flask_session import Session
import werkzeug.exceptions
from werkzeug.datastructures import MultiDict, ImmutableMultiDict
import requests
import redis
import yaml


debug_mode = os.getenv("OPENLI_PROVISIONER_WEB_DEBUG", "false")
if debug_mode == "true":
    logger = Logger(LogLevel.DEBUG)
    logger.debug("Starting in debug mode\n")
else:
    logger = Logger(LogLevel.INFO)

module_dir = os.path.dirname(os.path.abspath(openli_provisioner_web.__file__))
config_file = os.getenv("OPENLI_PROVISIONER_WEB_CONFIG_FILE", f"{module_dir}/config/config.yml")
api_file = os.getenv("OPENLI_PROVISIONER_WEB_API_FILE", f"{module_dir}/config/api.yml")
routes_file = os.getenv("OPENLI_PROVISIONER_WEB_ROUTES_FILE", f"{module_dir}/config/routes.yml")

try:
    logger.debug(f"Loading config from {config_file}")
    config = load_config(config_file)

    if logger.log_level != LogLevel.DEBUG:
        logger.log_level = LogLevel[config["log_level"]]
    if logger.log_level == LogLevel.DEBUG:
        config_copy = config.copy()

        if "session_cookie_signing_key" in config_copy:
            config_copy["session_cookie_signing_key"] = "CONTENTS HIDDEN"

        if "redis_password" in config_copy:
            config_copy["redis_password"] = "CONTENTS HIDDEN"

        logger.debug(yaml.dump(config_copy))

    logger.debug(f"\nLoading api definition from {api_file}")
    api_def = load_api(api_file)
    logger.debug(yaml.dump(api_def))

    logger.debug(f"\nLoading routes from {routes_file}")
    routes = load_routes(routes_file)
    logger.debug(yaml.dump(routes))
except ConfigLoadError as e:
    error_message = f"Failed to load {e.filename}"
    if e.message:
        error_message = f"{error_message}: {e.message}"
    logger.log_error(error_message)
    exit(1)
except ConfigFormatError as e:
    logger.log_error(f"Invalid format in configuration file {e.filename}:")
    logger.log_error(e.message)
    exit(1)
except:
    logger.log_error(traceback.format_exc())
    exit(1)

app = Flask(__name__, static_folder="build/static")

if config["api_auth_enabled"]:
    app.config["SESSION_COOKIE_DOMAIN"] = config["session_cookie_domain"]
    app.config["SESSION_COOKIE_PATH"] = config["session_cookie_path"]
    app.config["SESSION_COOKIE_SECURE"] = config["session_cookie_secure"]
    app.config["PERMANENT_SESSION_LIFETIME"] = config["session_lifetime_seconds"]
    app.config["SECRET_KEY"] = config["session_cookie_signing_key"]
    app.config["SESSION_KEY_PREFIX"] = "openli:provisioner:web:session:"
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_TYPE"] = "redis"
    app.config["SESSION_REDIS"] = redis.Redis(
        host=config["redis_host"],
        port=config["redis_port"],
        db=config["redis_db"],
        password=config["redis_password"] or None
    )
    Session(app)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def main_route(path):
    return send_from_directory("build", "index.html")


@app.route("/api.json")
def api_def_route():
    return jsonify(api_def)


@app.route("/routes.json")
def routes_route():
    return jsonify(routes)


@app.route("/config.json")
def config_route():
    return jsonify({
        "api_auth_enabled": config["api_auth_enabled"],
        "site_title": config["site_title"]
    })


@app.route("/api_check_login")
def check_login_route():
    if config["api_auth_enabled"]:
        if is_logged_in():
            return jsonify("Logged in"), 200
        else:
            return jsonify("Not logged in"), 401
    else:
        return jsonify("Authentication disabled"), 200


@app.route("/api/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def api_route(path):
    if config["api_auth_enabled"]:
        if not is_logged_in():
            raise(APIRequestException("Not logged in", 401))

        auth_type = session.get("auth_type")
        if auth_type == "digest":
            username = session.get("username")
            ha1 = session.get("ha1")
            auth = HTTPDigestAuthHA1(username, ha1)
        else:
            api_key = session.get("api_key")
            auth = HTTPAPIKeyAuth(api_key)
    else:
        auth = None

    try:
        r = requests.request(
            method=request.method,
            url=url_join(config["api_url"], path),
            params=request.args or None,
            json=request.json if request.is_json else None,
            auth=auth
        )
        status = r.status_code
        if "application/json" in r.headers.get("Content-Type", ""):
            response = r.json()
        else:
            response = r.text
    except Exception as e:
        raise(APIRequestException(original_exception=e))

    return jsonify(response), status


@app.route("/api_login", methods=["POST"])
def login_route():
    if not config["api_auth_enabled"]:
        return jsonify("Authentication disabled"), 200

    if is_logged_in():
        return jsonify("Already logged in"), 200

    try:
        data = request.json
        auth_type = data["auth_type"]
        if auth_type == "digest":
            username = data["username"]
            ha1 = data["ha1"]
            auth = HTTPDigestAuthHA1(username, ha1)
        elif auth_type == "api_key":
            api_key = data["api_key"]
            auth = HTTPAPIKeyAuth(api_key)
        else:
            response = "auth_type must be one of: digest, api_key"
            status = 400
            raise(APIRequestException(response, status))

        r = requests.request(
            method="GET",
            url=url_join(config['api_url'], 'agency'),  # Arbitrary endpoint to test authentication
            auth=auth
        )
        status = r.status_code

        if status < 400:
            session.clear()
            app.session_interface.save_session(app, session, Response())

            if app.session_cookie_name in request.cookies:
                cookies = MultiDict(request.cookies)
                cookies.pop(app.session_cookie_name)
                request.cookies = ImmutableMultiDict(cookies)

            session.sid = app.session_interface.open_session(app, request).sid
            session["auth_type"] = auth_type
            if auth_type == "digest":
                session["username"] = username
                session["ha1"] = ha1
            else:
                session["api_key"] = api_key

            response = "Logged in successfully"
            status = 200
        else:
            if "application/json" in r.headers.get("Content-Type", ""):
                response = r.json()
            else:
                response = r.text
    except Exception as e:
        raise(APIRequestException(original_exception=e))

    return jsonify(response), status


@app.route("/api_logout", methods=["POST"])
def logout_route():
    if config["api_auth_enabled"]:
        session.clear()
        return jsonify("Logged out"), 200
    else:
        return jsonify("Authentication disabled"), 200


@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, werkzeug.exceptions.InternalServerError):
        exception = e.original_exception
        if(exception and isinstance(exception, redis.exceptions.RedisError)):
            return handle_exception(exception)
        else:
            logger.log_error(traceback.format_exc())
            response = "Internal server error"
            status = 500
    elif isinstance(e, APIRequestException):
        response = e.message
        status = e.status
    elif isinstance(e, redis.exceptions.TimeoutError):
        response = "Connection to Redis server timed out"
        status = 504
    elif isinstance(e, redis.exceptions.AuthenticationError):
        response = "Authentication failed when connecting to Redis server, please check the server configuration"
        status = 500
    elif isinstance(e, redis.exceptions.AuthorizationError):
        response = "Server is unauthorized to connect to Redis server"
        status = 500
    elif isinstance(e, redis.exceptions.ConnectionError):
        response = "Failed to connect to Redis server, check that it can be reached"
        status = 500
    elif isinstance(e, redis.exceptions.RedisError):
        response = "Something went wrong when connecting to Redis server"
        status = 500
    else:
        logger.log_error(traceback.format_exc())
        response = "Internal server error"
        status = 500

    return jsonify(response), status


def is_logged_in():
    auth_type = session.get("auth_type")
    if auth_type == "digest" and session.get("username") and session.get("ha1"):
            return True
    elif auth_type == "api_key" and session.get("api_key"):
            return True
    return False


def url_join(*components):
    return "/".join(c.strip("/") for c in components)


class APIRequestException(Exception):
    def __init__(self, message=None, status=None, original_exception=None):
        self.message = message
        self.status = status
        self.original_exception = original_exception

        e = original_exception
        message = "Something went wrong"
        status = 500

        if isinstance(e, APIRequestException):
            message = e.message
            status = e.status
        elif isinstance(e, werkzeug.exceptions.BadRequest):
            message = "Request body contains invalid JSON"
            status = 400
        elif isinstance(e, KeyError):
            message = f"Request body must contain {e}"
            status = 400
        elif isinstance(e, requests.JSONDecodeError):
            message = "Received invalid JSON from API"
            status = 502
        elif isinstance(e, requests.ConnectionError):
            message = "Failed to connect to API endpoint, check that it can be reached"
            status = 500
        elif isinstance(e, requests.HTTPError):
            message = "Received an invalid HTTP response from API"
            status = 502
        elif isinstance(e, requests.URLRequired):
            message = "An invalid API URL was configured, please check the server configuration"
            status = 500
        elif isinstance(e, requests.TooManyRedirects):
            message = "Too many redirects when connecting to API"
            status = 508
        elif isinstance(e, requests.Timeout):
            message = "Request to API timed out"
            status = 504
        elif isinstance(e, Exception):
            logger.log_error(traceback.format_exc())

        self.message = self.message or message
        self.status = self.status or status
