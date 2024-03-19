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

import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import { useGetRequestJSON } from "./utilities/requests";
import { any, all, getFirst } from "./utilities/utils";
import "./App.css";

function App() {
    const [showMain, setShowMain] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const loginCheckCallback = useCallback((_, error) => {
        if(error && error.name === "BadResponseError" && error.response.status === 401) {
            setShowLogin(true);
        }
        setShowMain(true);
    }, [setShowLogin, setShowMain]);

    const loginCheck = useGetRequestJSON("/api_check_login", loginCheckCallback);
    const configCallback = useCallback((data, _) => {
        if(data) {
            if(data.api_auth_enabled) {
                loginCheck.start();
            } else {
                setShowMain(true);
            }
        }
    }, [loginCheck, setShowMain]);

    const apiRequest = useGetRequestJSON("/api.json");
    const routesRequest = useGetRequestJSON("/routes.json");
    const configRequest = useGetRequestJSON("/config.json", configCallback);

    const requests = useMemo(() => [
        apiRequest,
        routesRequest,
        configRequest,
    ], [apiRequest, routesRequest, configRequest]);
    const requestsStarted = useRef(false);

    useEffect(() => {
        if(any(requests, request => request.error)) {
            for (const request of requests) {
                request.cancel();
            }
        } else if(!requestsStarted.current) {
            for(const request of requests) {
                request.start();
            }
            requestsStarted.current = true;
        }
    }, [requests]);

    let element = null;
    if(any(requests, request => request.isLoading)) {
        element = <LoadingPage isLoading={ true } message="Fetching configuration..."/>
    } else if(any(requests, request => request.error)) {
        element = <LoadingPage error={ getFirst(requests, request => request.error) }/>
    } else if(loginCheck.isLoading) {
        element = <LoadingPage isLoading={ true } message="Checking login status..."/>
    } else if(loginCheck.error && (
            loginCheck.error.name !== "BadResponseError" ||
            loginCheck.error.response.status !== 401)) {
        element = <LoadingPage error={ loginCheck.error }/>
    } else if(showLogin) {
        element = <LoginPage loggedInCallback={ () => setShowLogin(false) } config={ configRequest.data }/>
    } else if(all(requests, request => request.data) && showMain) {
        const config = {
            "routes": routesRequest.data,
            "api": apiRequest.data,
            "config": configRequest.data,
        }

        element = <MainPage config={config} setShowLogin={ setShowLogin }/>
    } else {
        element = <LoadingPage/>
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/*" element={element}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
