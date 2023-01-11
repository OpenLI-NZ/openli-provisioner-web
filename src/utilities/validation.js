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

import {
    isArray,
    isBool,
    isDict,
    isInt,
    isNumber,
    isString,
    isStringInt,
    isStringNumber
} from "./utils";

const validationFunctionMap = {
    "str": validateString,
    "int": validateInt,
    "number": validateNumber,
    "bool": validateBool,
    "unix_timestamp": validateTimestamp,
    "ip": validateIP,
    "ip_range": validateIPRange,
    "port": validatePort,
    "email": validateEmail
}

const posIntRegex = /^[0-9]+$/;
const hex16Regex = /^[a-fA-F0-9]{1,4}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAPIInput(apiField, data) {
    if(isString(data)) {
        data = data.trim();
    }

    let dataLength = 0;
    if(data !== null) {
        if(isString(data) || isArray(data)) {
            dataLength = data.length;
        } else if(isDict(data)) {
            dataLength = Object.keys(data).length
        } else if(isNumber(data)) {
            dataLength = 1;
        } else if(data) {
            dataLength = 1;
        }
    }
    if(dataLength < 1) {
        if(apiField.required) {
            return {
                "invalid": true,
                "feedback": "is required"
            };
        } else {
            return valid();
        }
    }

    const validationFunction = validationFunctionMap[apiField.type];
    if(validationFunction) {
        return validationFunction(apiField, data);
    }

    return valid();
}

function valid() {
    return {
        "invalid": false,
        "feedback": ""
    };
}

function invalid(feedback="") {
    return {
        "invalid": true,
        "feedback": feedback
    };
}

function validateString(apiField, data) {
    if(!isString(data)) {
        return invalid("must be a string");
    }

    return valid();
}

function validatePort(apiField, data) {
    return validateInt(apiField, data, 1, 65535);
}

function validateInt(apiField, data, min=null, max=null) {
    if(!isInt(data) && !isStringInt(data)) {
        return invalid("must be an integer");
    }

    return validateNumber(apiField, data, min, max);
}

function validateNumber(apiField, data, min=null, max=null) {
    if(!isNumber(data) && !isStringNumber(data)) {
        return invalid("must be a number");
    }

    let number = data;
    if(isString(data)) {
        number = Number(data);
    }

    if("minimum" in apiField) {
        min = apiField.minimum;
    }

    if("maximum" in apiField) {
        max = apiField.maximum;
    }

    let inRange = true;

    if(min !== null && number < min) {
        inRange = false;
    }

    if(max !== null && number > max) {
        inRange = false;
    }

    if(!inRange) {
        let feedback = "";
        if(min !== null && max !== null) {
            feedback = `must be between ${min} and ${max} (inclusive)`;
        } else if(min !== null) {
            feedback = `must be more than or equal to ${min}`;
        } else if(max !== null) {
            feedback = `must be less than or equal to ${max}`;
        }
        return invalid(feedback);
    }

    return valid();
}

function validateBool(apiField, data) {
    if(isString(data)) {
        if(!(["false", "true"].includes(data.toLowerCase()))) {
            return invalid("must be a boolean");
        }
    } else if(!isBool(data)) {
        return invalid("must be a boolean");
    }

    return valid();
}

function validateTimestamp(apiField, data) {
    if(isStringInt(data)) {
        data = Number(data);
    }

    if(isInt(data)) {
        return validateNumber(apiField, data, 0);
    }

    if(!isString(data)) {
        return invalid("must be a string or int");
    }

    if(isNaN(Date.parse(data))) {
        return invalid("must be a valid datetime format");
    }

    return valid();
}

function validateEmail(apiField, data) {
    if(!isString(data)) {
        return invalid("must be a string");
    }

    if(!emailRegex.test(data)) {
        return invalid("must be a valid email address");
    }

    return valid();
}

function validateIP(apiField, data) {
    if(!isString(data)) {
        return invalid("must be a string");
    }

    if(!isIPv4(data) && !isIPv6(data)) {
        return invalid("must be a valid IP address");
    }

    return valid();
}

function validateIPRange(apiField, data) {
    if(!isString(data)) {
        return invalid("must be a string");
    }

    const components = data.split("/");

    if(components.length !== 2) {
        return invalid("must be a valid IP prefix");
    }

    const ip = components[0];
    const prefix = components[1];

    if(!posIntRegex.test(prefix)) {
        return invalid("must contain a positive integer prefix");
    }

    let maxPrefix = null;
    if(isIPv4(ip)) {
        maxPrefix = 32;
    } else if(isIPv6(ip)) {
        maxPrefix = 128;
    } else {
        return invalid("must contain a valid IP address");
    }

    const prefixInt = Number(prefix);
    if(prefixInt > maxPrefix) {
        return invalid(`must contain a prefix less than or equal to ${maxPrefix}`);
    }

    return valid();
}

function isIPv4(ip) {
    const components = ip.split(".");

    if(components.length > 4) {
        return false;
    }

    for(const component of components) {
        if(!posIntRegex.test(component)) {
            return false;
        }

        const number = Number(component);

        if(number < 0 || 255 < number) {
            return false;
        }
    }

    return true;
}

function isIPv6(ip) {
    const components = ip.split(":");

    if(components.length < 3 || 8 < components.length) {
        return false;
    }

    const first = components.splice(0, 1)[0];
    const last = components.splice(-1, 1)[0];
    const hasBlank = components.indexOf("") > -1;

    // Look for a second blank
    if(hasBlank && components.indexOf("", components.indexOf("") + 1) > -1) {
        return false;
    }

    if(first === "" && components.length > 1) {
        return false;
    }

    if(!hasBlank && components.length !== 6) {
        return false;
    }

    for(const component of components.concat([first, last])) {
        if(!hex16Regex.test(component) && component !== "") {
            return false;
        }
    }

    return true;
}

export {
    validateAPIInput,
    valid
};
