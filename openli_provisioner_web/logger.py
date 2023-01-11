"""Basic logging mechanism"""

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

import sys
from enum import IntEnum


class LogLevel(IntEnum):
    ERROR = 0
    WARNING = 1
    INFO = 2
    DEBUG = 3


class Logger:
    def __init__(self, log_level=LogLevel.INFO):
        self.log_level = log_level

    def log_message(self, message="", log_level=LogLevel.INFO, file=sys.stdout):
        if int(log_level) <= int(self.log_level):
            print(message, file=file, flush=True)

    def log_error(self, message=""):
        self.log_message(message, LogLevel.ERROR, sys.stderr)

    def log_warning(self, message=""):
        self.log_message(message, LogLevel.WARNING, sys.stderr)

    def log_info(self, message=""):
        self.log_message(message, LogLevel.INFO)

    def debug(self, message=""):
        self.log_message(message, LogLevel.DEBUG)
