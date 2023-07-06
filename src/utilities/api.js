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
    dateStringToUnixTimestamp,
    unixTimestampToDateString,
    isArray,
    isDict,
    isString,
    split
} from "./utils";
import { valid, validateAPIInput } from "./validation";

function outputhandoversToString(oh_val) {
    if (oh_val === 0) {
        return "IRIs and CCs";
    } else if (oh_val === 1) {
        return "IRIs only";
    } else if (oh_val === 2) {
        return "CCs only";
    } else {
        return "Invalid value";
    }
}

function stringToOutputhandovers(oh_str) {
    if (oh_str === "IRIs and CCs") {
        return 0;
    } else if (oh_str === "IRIs only") {
        return 1;
    } else if (oh_str === "CCs only") {
        return 2;
    }
    return 0;
}

function objectKey(object, objectType) {
    const delimiter = "key_delimiter" in objectType.api ? objectType.api.key_delimiter : "-";
    const objectKey = [];
    for(const key of objectType.api.key) {
        if(key in object) {
            objectKey.push(object[key]);
        } else {
            return null;
        }
    }
    return objectKey.join(delimiter);
}

function fieldLabel(routeField) {
    return routeField.label || routeField.name;
}

function listFields(objectType) {
    return objectType.route.list_fields || objectType.api.key;
}

function initialiseAPIData(apiFields, data={}) {
    for(const [key, apiField] of Object.entries(apiFields)) {
        if(key in data) {
            data[key] = initialiseAPIDataField(apiField, data[key]);
        } else {
            data[key] = initialAPIDataValue(apiField);
        }
    }
    return data;
}

function initialiseAPIDataField(apiField, data) {
    if(apiField.type === "dict") {
        if(isDict(data)) {
            return initialiseAPIData(apiField.fields, data);
        } else {
            return initialAPIDataValue(apiField);
        }
    } else if(apiField.type === "list") {
        if(isArray(data)) {
            for(const [i, value] of data.entries()) {
                data[i] = initialiseAPIDataField(apiField.elements, value);
            }
            return data;
        } else {
            return initialAPIDataValue(apiField);
        }
    } else {
        if(data instanceof Object) {
            return initialAPIDataValue(apiField);
        } else {
            return data;
        }
    }
}

function initialAPIDataValue(apiField) {
    if(apiField.default) {
        return apiField.default;
    } else if(apiField.type === "dict") {
        return initialiseAPIData(apiField.fields);
    } else if(apiField.type === "list") {
        if(apiField.required) {
            return [initialAPIDataValue(apiField.elements)];
        } else {
            return [];
        }
    } else if (apiField.type === "select" && apiField.defaultval) {
        return apiField.defaultval;
    } else {
        return "";
    }
}

function validateAPIData(apiFields, data={}) {
    let isValid = true;
    const validation = {};

    for(const [key, apiField] of Object.entries(apiFields)) {
        if(key in data) {
            const [valid, field] = validateAPIField(apiField, data[key]);

            if(!valid) {
                isValid = false;
            }

            validation[key] = field;
        } else {
            validation[key] = initialAPIValidationValue(apiField);
        }
    }

    return [isValid, validation];
}

function validateAPIField(apiField, data) {
    if(apiField.type === "dict") {
        if(isDict(data)) {
            return validateAPIData(apiField.fields, data);
        } else {
            return [true, initialAPIValidationValue(apiField)];
        }
    } else if(apiField.type === "list") {
        if(isArray(data)) {
            let isValid = true;
            const validation = [];

            for(const value of data) {
                const [valid, field] = validateAPIField(apiField.elements, value);

                if(!valid) {
                    isValid = false;
                }

                validation.push(field);
            }

            return [isValid, validation];
        } else {
            return [true, initialAPIValidationValue(apiField)];
        }
    } else {
        if(data instanceof Object) {
            return [true, initialAPIValidationValue(apiField)];
        } else {
            const validation = validateAPIInput(apiField, data);
            return [!validation.invalid, validation];
        }
    }
}

function initialAPIValidationValue(apiField) {
    if(apiField.type === "dict") {
        return validateAPIData(apiField.fields)[1];
    } else if(apiField.type === "list") {
        if(apiField.required) {
            return [initialAPIValidationValue(apiField.elements)];
        } else {
            return [];
        }
    } else {
        return valid();
    }
}

function formatAPIData(apiFields, data, reverse=false) {
    for(const [key, apiField] of Object.entries(apiFields)) {
        if(key in data) {
            data[key] = formatAPIDataField(key, apiField, data[key], reverse);
        }
    }
    return data;
}

function formatAPIDataField(key, apiField, data, reverse=false) {
    if(apiField.type === "dict") {
        if(isDict(data)) {
            return formatAPIData(apiField.fields, data, reverse);
        } else {
            return data;
        }
    } else if(apiField.type === "list") {
        if(isArray(data)) {
            for(const [i, value] of data.entries()) {
                data[i] = formatAPIDataField(i, apiField.elements, value,
                        reverse);
            }
            return data;
        } else {
            return data;
        }
    } else {
        if(data instanceof Object) {
            return data;
        } else if(apiField.type === "unix_timestamp"){
            if(reverse) {
                return unixTimestampToDateString(data);
            } else {
                return dateStringToUnixTimestamp(data);
            }
        } else if (key === "outputhandovers") {
            if(reverse) {
                return outputhandoversToString(data);
            } else {
                return stringToOutputhandovers(data);
            }
        } else {
            return data;
        }
    }
}

function toAPIObject(objectType, data) {
    if(isDict(data)) {
        return data;
    }

    const dict = {};

    if(isArray(data)) {
        for(const [i, value] of data.entries()) {
            if(i in objectType.api.key) {
                dict[objectType.api.key[i]] = value;
            }
        }
    } else if(isString(data)) {
        const delimiter = "key_delimiter" in objectType.api ? objectType.api.key_delimiter : "-";
        for(const [i, value] of split(data, delimiter, objectType.api.key.length - 1).entries()) {
            dict[objectType.api.key[i]] = value;
        }
    } else {
        dict[objectType.api.key[0]] = data;
    }

    return dict;
}

function sortAPIObjects(objectType, objects) {
    if ("key" in objectType.api) {
        objects.sort((a,b) => {
            for (const f of objectType.api.key) {
                if (a[f].toLowerCase() < b[f].toLowerCase()) {
                    return -1;
                } else if (a[f].toLowerCase() > b[f].toLowerCase()) {
                    return 1;
                }
            }
            return 0;
        });
    }

    return objects;
}

export {
    objectKey,
    initialiseAPIData,
    initialAPIDataValue,
    validateAPIData,
    initialAPIValidationValue,
    fieldLabel,
    listFields,
    formatAPIData,
    toAPIObject,
    sortAPIObjects
};
