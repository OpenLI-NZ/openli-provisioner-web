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

import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Table, Spinner } from "react-bootstrap";
import APIFormPage from "./APIFormPage";
import Loading from "../components/Loading";
import Message from "../components/Message";
import Prompt from "../components/Prompt";
import { APIObjectField } from "../components/APIObject";
import { useGetRequestJSON, useDeleteRequestJSON } from "../utilities/requests";
import { fieldLabel, listFields, objectKey, formatAPIData, toAPIObject, sortAPIObjects } from "../utilities/api";
import { getErrorMessage } from "../utilities/errors";
import { pathJoin, deepCopyJSON } from "../utilities/utils";

function APIObjectListPage({title, objectType, path, config}) {
    const [objects, setObjects] = useState(null);

    const requestCallback = useCallback((data, _) => {
        if(data) {
            data = sortAPIObjects(objectType, data);
            setObjects(data);
        }
    }, [setObjects, objectType]);
    const request = useGetRequestJSON("/" + pathJoin(["api", objectType.api.path]), requestCallback);
    const requestStarted = useRef(false);

    const isNewObject = useLocation().search.startsWith("?add");
    const navigate = useNavigate();

    useEffect(() => {
        if(objectType.api.methods.includes("GET") && !requestStarted.current && !isNewObject) {
          request.start();
        }

        if(!requestStarted.current) {
            requestStarted.current = true;
        }
    }, [request, isNewObject, objectType]);

    const [deleteKey, setDeleteKey] = useState("");
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [showDeletePrompt, setShowDeletePrompt] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showDeleteError, setShowDeleteError] = useState(false);
    const deleteCallback = useCallback((_, error) => {
        if(error) {
            setDeleteError(getErrorMessage(error));
            setShowDeleteError(true);
        } else {
            const newObjects = [...objects];
            newObjects.splice(deleteIndex, 1);
            setObjects(newObjects);
        }
    }, [objects, deleteIndex, setDeleteError, setShowDeleteError, setObjects]);
    const deleteRequest = useDeleteRequestJSON("/" + pathJoin([
        "api",
        objectType.api.path,
        encodeURIComponent(deleteKey)
    ]), deleteCallback);

    const state = {
        "deleteRequest": deleteRequest,
        "deleteKey": deleteKey,
        "setDeleteKey": setDeleteKey,
        "deleteIndex": deleteIndex,
        "setDeleteIndex": setDeleteIndex,
        "showDeletePrompt": showDeletePrompt,
        "setShowDeletePrompt": setShowDeletePrompt,
        "navigate": navigate
    }

    if(objectType.api.methods.includes("POST") && isNewObject) {
        return(
            <>
            <h1>{ title }</h1>
            <APIFormPage
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
                        { objectType.api.methods.includes("POST") &&
                            <Button
                                variant="success"
                                onClick={() => {
                                    request.cancel();
                                    navigate(`${path}?add`);
                                }}>
                                <b>+</b> Add
                            </Button> }
                    </Col>
                </Row>
                { request.isLoading ?
                    <Loading message="Fetching objects..."/>
                : request.error ?
                    <Message variant="danger" message={ getErrorMessage(request.error) }/>
                : objects ?
                    <Row><Col>
                        <Table>
                            <thead>
                                <tr>
                                    { objectType.route.fields.map((f) => {
                                        if(listFields(objectType).includes(f.name)) {
                                            return(<th>{ fieldLabel(f) }</th>);
                                        } else {
                                            return(<></>);
                                        }
                                    })}
                                    { (objectType.api.methods.includes("PUT") || objectType.api.methods.includes("DELETE")) &&
                                        <th style={ {"width": "0"} }></th>
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                { 
                                  objects.map((object, index) => {
                                    const data = formatAPIData(objectType.api.fields, toAPIObject(objectType, deepCopyJSON(object)), true);
                                    return(<APIObjectListItem
                                        key={ objectKey(data, objectType) }
                                        index={ index }
                                        object={ data }
                                        objectType={ objectType }
                                        path={ path }
                                        state={ state }/>);
                                })}
                            </tbody>
                        </Table>

                        <Prompt
                            request={ deleteRequest }
                            show={ showDeletePrompt }
                            setShow={ setShowDeletePrompt }
                            title="Delete"
                            message={ `Are you sure you want to delete ${deleteKey}?` }
                            confirmText="Delete"/>

                        <Prompt
                            show={ showDeleteError }
                            setShow={ setShowDeleteError }
                            title="Something went wrong"
                            message={ deleteError }/>
                    </Col></Row>
                : <></>}
            </Container>
        );
    }
}

function APIObjectListItem({index, object, objectType, path, state}) {
    const getByID = !("get_by_id" in objectType.api) || objectType.api.get_by_id;
    const id = objectKey(object, objectType);

    return(
        <tr>
            { objectType.route.fields.map((f) => {
                if(listFields(objectType).includes(f.name) && f.name in object) {
                    const field = {"route": f, "api": objectType.api.fields[f.name]};
                    let element = <APIObjectField field={ field } data={ object[f.name] }/>;

                    if(getByID && objectType.api.key.includes(f.name)) {
                        element = <Link to={`${path}/${encodeURIComponent(id)}`}>{ element }</Link>;
                    }

                    return(<td>{ element }</td>);
                } else {
                    return(<></>);
                }
            })}
            { (objectType.api.methods.includes("PUT") || objectType.api.methods.includes("DELETE")) &&
                <td style={ {"white-space": "nowrap"} }>
                    <div className="btn-row">
                        { objectType.api.methods.includes("PUT") &&
                            <Button
                                variant="warning"
                                size="sm"
                                onClick={ () => state.navigate(`${path}/${encodeURIComponent(id)}?edit`) }>
                                Edit
                            </Button>
                        }
                        { objectType.api.methods.includes("DELETE") &&
                            <Button
                                variant="danger"
                                size="sm"
                                disabled={ state.deleteRequest.isLoading }
                                onClick={ () => {
                                    state.setDeleteKey(id);
                                    state.setDeleteIndex(index);
                                    state.setShowDeletePrompt(true);
                                }}>
                                { state.deleteRequest.isLoading && state.deleteIndex === index ?
                                    <Spinner animation="border" size="sm" role="status"/> :
                                    "Delete" }
                            </Button>
                        }
                    </div>
                </td>
            }
        </tr>
    )
}

export default APIObjectListPage;
