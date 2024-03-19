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

import { useCallback, useState } from "react";
import { Button, Col, Nav, Spinner } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import Prompt from "./Prompt";
import NavigationAPIRoute from "./NavigationAPIRoute";
import { usePostRequestJSON } from "../utilities/requests";
import { getErrorMessage } from "../utilities/errors";

function Navigation({config, setShowLogin}) {
    const path = useLocation().pathname;
    let activePath = "";
    if(path !== "/") {
        let route = config.routes;
        let pathComponents = path
            .replace(/^\/|\/$/g, "")
            .split("/");

        for(const c of pathComponents) {
            if("routes" in route) {
                if(c in route.routes) {
                    activePath = `${activePath}/${c}`;
                    route = route.routes[c];
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    const [logoutError, setLogoutError] = useState("");
    const [showLogoutError, setShowLogoutError] = useState(false);

    const callback = useCallback((_, error) => {
        if(error) {
            setLogoutError(getErrorMessage(error));
            setShowLogoutError(true);
        } else {
            setShowLogin(true);
        }
    }, [setShowLogin]);

    const logoutRequest = usePostRequestJSON("/api_logout", callback);

    return(
        <Col
            xs={12}
            md={6}
            className="sidenav d-flex flex-column">
            <div className="sidenav-header">
                <Link to="/">
                    <h1>OpenLI Provisioner</h1>
                    { config.config.site_title && <h2>{ config.config.site_title }</h2> }
                </Link>
            </div>

            <Nav className="d-flex flex-column h-100" style={{overflow: "auto"}}>
                <NavigationAPIRoute route={ config.routes } openliversion={ config.openliversion } activePath = { activePath }/>
            </Nav>

            { config.config.api_auth_enabled && <div className="sidenav-footer">
                <ul className="nav">
                    <li className="nav-item">
                        <Button
                            variant="link"
                            disabled={ logoutRequest.isLoading }
                            onClick={ () => logoutRequest.start() }>
                            { logoutRequest.isLoading ?
                                <Spinner animation="border" size="sm" role="status"/> :
                                "Logout"}
                        </Button>
                        <Prompt
                            show={ showLogoutError }
                            setShow={ setShowLogoutError }
                            title="Something went wrong"
                            message={ logoutError }/>
                    </li>
                </ul>
            </div> }
        </Col>
    );
}

export default Navigation;
