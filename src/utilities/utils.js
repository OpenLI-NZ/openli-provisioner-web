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

function deepCopyJSON(d) {
    return JSON.parse(JSON.stringify(d));
}

function dataGet(d, key) {
    let item = d;
    for(const k of key) {
        if(k in item) {
            item = item[k];
        } else {
            return null;
        }
    }
    return item;
}

function dataSet(d, key, value) {
    let item = d;
    for(const k of key.slice(0, -1)) {
        if(!(k in item)) {
            item[k] = {};
        }
        item = item[k];
    }
    item[key.at(-1)] = value;
    return d;
}

function dataTrim(data) {
    for(const key of Object.keys(data)) {
        if(data[key] instanceof Object) {
            data[key] = dataTrim(data[key]);
        } else if(!(data instanceof Array) &&
                (!data[key] && data[key] !== "")) {
            // note: allow empty string as this could be a valid input value
            delete data[key];
        }
    }
    return data;
}

function split(text, delimiter, limit=-1) {
    if(limit < 0) {
        return text.split(delimiter)
    } else if(limit === 0) {
        return [text];
    }

    let splitResult = text.split(delimiter);
    return splitResult.slice(0, limit).concat([splitResult.slice(limit).join(delimiter)]);
}

function any(array, checkFunction) {
    for(const item of array) {
        if(checkFunction(item)) {
            return true;
        }
    }
    return false;
}

function all(array, checkFunction) {
    for(const item of array) {
        if(!checkFunction(item)) {
            return false;
        }
    }
    return true;
}

function getFirst(array, getFunction) {
    for(const item of array) {
        const result = getFunction(item);
        if(result) {
            return result;
        }
    }
    return null;
}

function isString(v) {
    return typeof v === "string" || v instanceof String;
}

function isDict(v) {
    return v instanceof Object && !isArray(v);
}

function isArray(v) {
    return v instanceof Array;
}

function isInt(v) {
    return isNumber(v) && Number.isInteger(v);
}

function isNumber(v) {
    return typeof v === "number" || v instanceof Number;
}

function isBool(v) {
    return typeof v === "boolean" || v instanceof Boolean;
}

function isStringInt(v) {
    if(!isString) {
        return false;
    }

    return Number.isInteger(Number(v));
}

function isStringNumber(v) {
    if(!isString) {
        return false;
    }

    return !isNaN(Number(v));
}

function parseNumericString(str) {
    if (/^\d+$/.test(str)) {
        return parseInt(str);
    } else {
        return NaN;
    }
}

function dateStringToUnixTimestamp(date) {
    if(!isString(date)) {
        return date;
    }

    const parsedDate = Date.parse(date);

    if(isNaN(parsedDate)) {
        return NaN;
    }

    return Math.floor(parsedDate / 1000);
}

function unixTimestampToDateString(date) {
    if(isStringInt(date)) {
        date = Number(date);
    }

    if(!isInt(date)) {
        return null;
    }

    const d = new Date(date * 1000);
    const YYYY = String(d.getFullYear()).padStart(4, "0");
    const MM = String(d.getMonth() + 1).padStart(2, "0");  // getMonth() is zero-based
    const DD = String(d.getDate()).padStart(2, "0");
    const HH = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}`;
}

function pathJoin(components) {
    let result = [];
    for(const c of components) {
        if (c === undefined) {
            continue;
        }
        if (c === null || c === '') {
            continue;
        }
        result.push(c.replace(/^\/+/, "").replace(/\/+$/, ""));
    }
    return result.join("/");
}

export {
    split,
    dataGet,
    dataSet,
    dataTrim,
    deepCopyJSON,
    any,
    all,
    getFirst,
    isString,
    isDict,
    isArray,
    isInt,
    isNumber,
    isBool,
    isStringInt,
    isStringNumber,
    parseNumericString,
    dateStringToUnixTimestamp,
    unixTimestampToDateString,
    pathJoin
};
