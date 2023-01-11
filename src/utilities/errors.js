// OpenLI Provisioner Web Interface
// Copyright (C) 2023 The University of Waikato, Hamilton, New Zealand. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

function getErrorMessage(error, customMessages={}) {
    if(!error) {
        return "Unknown error";
    }

    if(error.name === "BadResponseError") {
        const status = error.response.status;

        if(status in customMessages) {
            return customMessages[status];
        }

        if(typeof error.data === "string" || error.data instanceof String) {
            return error.data.replace(/<\/?[a-z]+>/g, "");
        }
    }

    if(error.name in customMessages) {
        return customMessages[error.name];
    }

    if(error.name === "TypeError" && error.message === "Failed to fetch") {
        return "Failed to contact server"
    }

    return error.message;
}

export { getErrorMessage };
