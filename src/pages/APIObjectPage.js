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

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import APIFormPage from "./APIFormPage";
import Loading from "../components/Loading";
import Message from "../components/Message";
import APIObject from "../components/APIObject";
import Prompt from "../components/Prompt";
import { getErrorMessage } from "../utilities/errors";
import { useDeleteRequestJSON, useGetRequestJSON } from "../utilities/requests";
import { deepCopyJSON, pathJoin } from "../utilities/utils";
import { formatAPIData, toAPIObject } from "../utilities/api";

function APIObjectPage({title, objectKey, objectType, path, parentPath, config}) {
    const apiPath = "/" + pathJoin([
        "api",
        objectType.api.path,
        encodeURIComponent(objectKey[objectType.route.name])
    ]);
    const request = useGetRequestJSON(apiPath);
    const requestStarted = useRef(false);

    const isEditing = useLocation().search.startsWith("?edit");
    const navigate = useNavigate();


    const [deleteError, setDeleteError] = useState("");
    const [showDeleteError, setShowDeleteError] = useState(false);
    const deleteCallback = useCallback((_, error) => {
        if(error) {
            setDeleteError(getErrorMessage(error));
            setShowDeleteError(true);
        } else {
            navigate(parentPath);
        }
    }, [parentPath, navigate, setDeleteError, setShowDeleteError]);
    const deleteRequest = useDeleteRequestJSON(apiPath, deleteCallback);
    const [showDeletePrompt, setShowDeletePrompt] = useState(false);

    useEffect(() => {
        if(objectType.api.methods.includes("GET") && !requestStarted.current) {
            request.start();
        }

        if(!requestStarted.current) {
            requestStarted.current = true;
        }
    }, [request, isEditing, objectType]);

    if(objectType.api.methods.includes("PUT") && isEditing && request.data) {
        return(
            <>
            <h1>{ title }</h1>
            <APIFormPage
                object={ request.data }
                objectType={ objectType }
                config={ config }
                cancelCallback={ () => {
                    navigate(path);
                    request.start();
                }}/>
            </>
        );
    } else {
        return(
            <Container className="h-100 p-0 d-flex flex-column" fluid>
                <Row className="pb-3">
                    <Col xs={12} md>
                        <h1>{ title }</h1>
                    </Col>
                    <Col xs={12} md="auto">
                        <div className="btn-row">
                            { objectType.api.methods.includes("PUT") && request.data &&
                                <Button
                                    variant="warning"
                                    disabled={ deleteRequest.isLoading }
                                    onClick={() => {
                                        navigate(`${path}?edit`);
                                    }}>
                                    Edit
                                </Button>
                            }
                            { objectType.api.methods.includes("DELETE") && request.data &&
                                <>
                                <Button
                                    variant="danger"
                                    disabled={ deleteRequest.isLoading }
                                    onClick={() => {
                                        setShowDeletePrompt(true);
                                    }}>
                                    { deleteRequest.isLoading ?
                                        <Spinner animation="border" size="sm" role="status"/> :
                                        "Delete" }
                                </Button>

                                <Prompt
                                    request={ deleteRequest }
                                    show={ showDeletePrompt }
                                    setShow={ setShowDeletePrompt }
                                    title="Delete"
                                    message={ `Are you sure you want to delete ${title}?` }
                                    confirmText="Delete"/>

                                <Prompt
                                    show={ showDeleteError }
                                    setShow={ setShowDeleteError }
                                    title="Something went wrong"
                                    message={ deleteError }/>
                                </>
                            }
                        </div>
                    </Col>
                </Row>
                { request.isLoading ?
                        <Loading message="Fetching object..."/>
                    : request.error ?
                        <Message variant="danger" message={ getErrorMessage(request.error) }/>
                    : request.data ?
                        <Row><Col>
                            <APIObject
                                fields={ {"route": objectType.route.fields, "api": objectType.api.fields} }
                                data={ formatAPIData(objectType.api.fields, toAPIObject(objectType, deepCopyJSON(request.data)), true) }/>
                        </Col></Row>
                    : <></>
                }
            </Container>
        );
    }
}

export default APIObjectPage;
