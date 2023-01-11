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

import { useCallback, useEffect, useState, useRef } from "react";

function useGetRequestJSON(url, callback=() => {}) {
    return useRequestJSON(url, "GET", callback);
}

function usePostRequestJSON(url, callback=() => {}) {
    return useRequestJSON(url, "POST", callback);
}

function usePutRequestJSON(url, callback=() => {}) {
    return useRequestJSON(url, "PUT", callback);
}

function useDeleteRequestJSON(url, callback=() => {}) {
    return useRequestJSON(url, "DELETE", callback);
}

function useRequestJSON(url, method="GET", callback=() => {}) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const abortController = useRef(null);

    useEffect(() => {
        return () => abortController.current && abortController.current.abort();
    }, [abortController]);

    const cancel = useCallback(() => {
        if(abortController.current) {
            abortController.current.abort();
            setIsLoading(false);
            return true;
        } else {
            return false;
        }
    }, [abortController]);

    const start = useCallback((requestData=null) => {
        if(!isLoading) {
            setIsLoading(true);
            setData(null);
            setError(null);

            abortController.current = new AbortController();

            let settings = {
                method: method,
                headers: {
                    "Accept": "application/json"
                },
                credentials: "same-origin",
                signal: abortController.current.signal
            };

            if(requestData !== null) {
                settings.headers["Content-Type"] = "application/json";
                settings.body = JSON.stringify(requestData);
            }

            let jsonCallback = null;
            fetch(url, settings).then(response => {
                if(response.ok) {
                    jsonCallback = data => {
                        setData(data);
                        return null;
                    };
                } else {
                    jsonCallback = data => {
                        const e = new BadResponseError(url, response, data);
                        setError(e);
                        return e;
                    };
                }

                return response.json();
            }).then(data => {
                setIsLoading(false);
                const e = jsonCallback(data);
                callback(data, e);
            }).catch(e => {
                if(e.name !== "AbortError") {
                    setIsLoading(false);
                    setError(e);
                    callback(null, e);
                }
            });
        }
    }, [url, method, callback, isLoading]);

    return {
        "data": data,
        "error": error,
        "isLoading": isLoading,
        "url": url,
        "cancel": cancel,
        "start": start};
}

class BadResponseError extends Error {
    constructor(url, response, data) {
        const message = `Failed to load ${url}: ${response.statusText}(${response.status})`
        super(message);
        this.name = "BadResponseError";
        this.url = url;
        this.response = response;
        this.data = data;
    }
}

export {
    useRequestJSON,
    useGetRequestJSON,
    usePostRequestJSON,
    usePutRequestJSON,
    useDeleteRequestJSON,
    BadResponseError
};
