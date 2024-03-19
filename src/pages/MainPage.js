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

import { Col, Container, Row } from "react-bootstrap";
import APIRoutePage from "./APIRoutePage";
import Navigation from "../components/Navigation";
import { useGetRequestJSON } from "../utilities/requests";
import { useEffect, useRef, useMemo } from "react";
import LoadingPage from "./LoadingPage";
import { any, all, getFirst } from "../utilities/utils";


function MainPage({config, setShowLogin}) {
    const versionRequest = useGetRequestJSON("/api/openliversion");

    const requests = useMemo(() => [
        versionRequest
    ], [versionRequest]);
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

    if(any(requests, request => request.isLoading)) {
        return <LoadingPage isLoading={ true } message="Fetching configuration..."/>
    } else if (any(requests, request => request.error)) {
        if (versionRequest.error) {
            // provisioner may pre-date the version endpoint, so just
            // assume 1.1.1 was the version
            config["openliversion"] = {
                "major": 1, "minor": 1, "revision": 1, "fullversion": "1.1.1"
            }
        } else {
                return <LoadingPage error={ getFirst(requests,
                        request => request.error) }/>
        }
    } else if(all(requests, request => request.data)) {
        config["openliversion"] = versionRequest.data;
    } else {
        return <LoadingPage/>
    }

    return(
        <Container fluid>
            <Row className="h-100">
                <Navigation config={ config } setShowLogin={ setShowLogin }/>
                <Col
                    xs={12}
                    md
                    className="content d-flex flex-column px-md-5">
                    <APIRoutePage config={ config }/>
                </Col>
            </Row>
        </Container>
    )
}

export default MainPage;
