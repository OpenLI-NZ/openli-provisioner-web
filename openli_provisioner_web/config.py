"""Configuration loading and checking"""

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

import errno

import jsonschema
from jsonschema.exceptions import ValidationError
import yaml
from yaml import YAMLError


VALIDATOR_CLASS = jsonschema.Draft7Validator

CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "site_title": {
            "type": "string",
            "default": ""
        },
        "api_url": {
            "type": "string",
            "default": "http://localhost:8992"
        },
        "api_auth_enabled": {
            "type": "boolean",
            "default": True
        },
        "ignore_tls_verification": {
            "type": "boolean",
            "default": False
        },
        "log_level": {
            "type": "string",
            "enum": [
                "ERROR",
                "WARNING",
                "INFO",
                "DEBUG"
            ],
            "default": "INFO"
        },
        "redis_host": {
            "type": "string",
            "default": "localhost"
        },
        "redis_port": {
            "type": "integer",
            "minimum": 1,
            "maximum": 65535,
            "default": 6379
        },
        "redis_db": {
            "type": "integer",
            "minimum": 0,
            "default": 0
        },
        "redis_password": {
            "type": "string",
            "default": ""
        },
        "session_cookie_domain": {
            "type": "string",
            "minLength": 1
        },
        "session_cookie_path": {
            "type": "string",
            "default": "/"
        },
        "session_cookie_secure": {
            "type": "boolean",
            "default": False
        },
        "session_lifetime_seconds": {
            "type": "integer",
            "minimum": 60,
            "default": 3600
        },
        "session_cookie_signing_key": {
            "type": "string",
            "minLength": 20
        }
    },
    "additionalProperties": False,
    "if": {
        "properties": {
            "api_auth_enabled": { "const": True }
        }
    },
    "then": {
        "required": [
            "session_cookie_domain",
            "session_cookie_signing_key"
        ]
    }
}

API_SCHEMA = {
    "type": "object",
    "properties": {
        "objects": {
            "type": "object",
            "patternProperties": {
                ".+": {
                    "type": "object",
                    "properties": {  # TODO: add all properties
                        "path": {
                            "type": "string",
                            "minLength": 1
                        }
                    },
                    "additionalProperties": True
                }
            }
        }
    },
    "additionalProperties": False,
    "required": [
        "objects"
    ]
}

ROUTES_SCHEMA = {
    "type": "object",
    "properties": {  # TODO: add all properties
        "title": {
            "type": "string",
            "minLength": 1
        }
    },
    "additionalProperties": True,
    "required": [
        "title"
    ]
}


def load_config(filename):
    return load_yaml(filename, CONFIG_SCHEMA)


def load_api(filename):
    return load_yaml(filename, API_SCHEMA)


def load_routes(filenam):
    return load_yaml(filenam, ROUTES_SCHEMA)


def load_yaml(filename, schema):
    try:
        with open(filename, "r") as f:
            config = yaml.safe_load(f)

        jsonschema.validators.extend(
            VALIDATOR_CLASS, {"properties" : jsonschema_set_defaults}
        )(schema).validate(config)
    except IOError as e:
        if e.errno == errno.ENOENT:
            raise ConfigLoadError(filename, "does not exist")
        elif e.errno == errno.EACCES:
            raise ConfigLoadError(filename, "permission denied")
        else:
            raise ConfigLoadError(filename, None)
    except YAMLError as e:
        raise ConfigLoadError(filename, f"invalid YAML\n{e}")
    except ValidationError as e:
        config_path = e.json_path.replace("$", "", 1).replace(".", "", 1)

        if config_path == "api_url":
            message = f"'{e.instance}' is an invalid URL"
        else:
            message = e.message

        if config_path:
            message = f"{config_path}: {message}"

        raise ConfigFormatError(filename, message)

    return config


def jsonschema_set_defaults(validator, properties, instance, schema):
    for property, subschema in properties.items():
        if "default" in subschema:
            instance.setdefault(property, subschema["default"])

    for error in VALIDATOR_CLASS.VALIDATORS["properties"](validator, properties, instance, schema):
        yield error


class ConfigLoadError(Exception):
    def __init__(self, filename, message):
        self.filename = filename
        self.message = message


class ConfigFormatError(Exception):
    def __init__(self, filename, message):
        self.filename = filename
        self.message = message
