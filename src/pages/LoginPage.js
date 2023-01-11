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

import { useState, useCallback } from "react";
import { Button, Card, Form, Spinner, Stack } from "react-bootstrap";
import md5 from "crypto-js/md5";
import { usePostRequestJSON } from "../utilities/requests";
import { deepCopyJSON, dataTrim, dataSet } from "../utilities/utils";
import { getErrorMessage } from "../utilities/errors";
import Message from "../components/Message";

function LoginPage({loggedInCallback, config}) {
    const [authType, setAuthType] = useState("digest");
    const [data, setData] = useState({
        "digest": {
            "username": "",
            "password": ""
        },
        "api_key": {
            "api_key": ""
        }
    });
    const [validation, setValidation] = useState(initialValidationState());

    const [error, setError] = useState("");
    const [showError, setShowError] = useState(false);

    const callback = useCallback((_, error) => {
        if(error) {
            setError(getErrorMessage(error, {401: "Invalid credentials"}));
            setShowError(true);
        } else {
            loggedInCallback();
        }
    }, [loggedInCallback, setError, setShowError]);

    const request = usePostRequestJSON("/api_login", callback);

    const state = {
        "data": data,
        "setData": setData,
        "authType": authType,
        "setAuthType": setAuthType,
        "validation": validation,
        "setValidation": setValidation,
        "request": request
    };

    let switchText = "";
    if(authType === "digest") {
        switchText = "API key";
    } else {
        switchText = "password-based";
    }
    switchText = `Switch to ${switchText} authentication`;

    let input = null;
    if(authType === "digest") {
        input = (<>
            <div className="form-group">
                <Form.Label for="input_username">Username</Form.Label>
                <Form.Control
                    id="input_username"
                    type="text"
                    placeholder="Username"
                    value={ data.digest.username }
                    onChange={ (event) => handleChange(event, ["digest", "username"], state) }
                    isInvalid={ validation.digest.username.invalid }
                    disabled={ request.isLoading }/>
                <Form.Control.Feedback type="invalid">
                    { validation.digest.username.feedback }
                </Form.Control.Feedback>
            </div>
            <div className="form-group">
                <Form.Label for="input_password">Password</Form.Label>
                <Form.Control
                    id="input_password"
                    type="password"
                    placeholder="Password"
                    value={ data.digest.password }
                    onChange={ (event) => handleChange(event, ["digest", "password"], state) }
                    isInvalid={ validation.digest.password.invalid }
                    disabled={ request.isLoading }/>
                <Form.Control.Feedback type="invalid">
                    { validation.digest.password.feedback }
                </Form.Control.Feedback>
            </div>
        </>);
    } else {
        input = (<>
            <div className="form-group">
                <Form.Label for="input_api_key">API Key</Form.Label>
                <Form.Control
                    id="input_api_key"
                    type="password"
                    placeholder="API Key"
                    value={ data.api_key.api_key }
                    onChange={ (event) => handleChange(event, ["api_key", "api_key"], state) }
                    isInvalid={ validation.api_key.api_key.invalid }
                    disabled={ request.isLoading }/>
                <Form.Control.Feedback type="invalid">
                    { validation.api_key.api_key.feedback }
                </Form.Control.Feedback>
            </div>
        </>);
    }

    return(
        <Stack gap={ 3 } className="align-items-center justify-content-center p-3">
            <h1>OpenLI Provisioner</h1>
            { config.site_title && <h2>{ config.site_title }</h2> }
            <Card>
                <Card.Header>
                    <h2>Login</h2>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={ (event) => {
                        setShowError(false);
                        handleSubmit(event, state);
                    }}>
                        <Message
                            variant="danger"
                            message={ error }
                            show={ showError }
                            setShow={ setShowError }/>
                        { input }
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={ request.isLoading }>
                            { request.isLoading ?
                                <Spinner animation="border" size="sm" role="status"/> :
                                "Login" }
                        </Button>
                        <Button
                            variant="link"
                            type="button"
                            disabled={ request.isLoading }
                            onClick={ () => {
                                if(authType === "digest") {
                                    setAuthType("api_key");
                                } else {
                                    setAuthType("digest");
                                }
                            }}>{ switchText }
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Stack>
    );
}

function prepareData(state) {
    const data = state.data[state.authType];
    let result = deepCopyJSON(data);
    result["auth_type"] = state.authType;

    if(state.authType === "digest") {
        delete result.password;
        result["ha1"] = md5(`${data.username}:provisioner@openli.nz:${data.password}`).toString();
    }

    result = dataTrim(result);
    return result;
}

function handleChange(event, key, state) {
    const type = event.target.type;
    const value = type === "checkbox" ? event.target.checked : event.target.value;
    const result = deepCopyJSON(state.data);
    dataSet(result, key, value);
    state.setData(result);
}

function handleSubmit(event, state) {
    event.preventDefault();

    if(validate(state)) {
        state.request.start(prepareData(state));
    }
}

function initialValidationState() {
    return {
        "digest": {
            "username": {
                "invalid": false,
                "feedback": ""
            },
            "password": {
                "invalid": false,
                "feedback": ""
            }
        },
        "api_key": {
            "api_key": {
                "invalid": false,
                "feedback": ""
            }
        }
    };
}

function validate(state) {
    const data = state.data[state.authType];
    let isValid = true;
    let validationResult = initialValidationState();
    let v = validationResult[state.authType];

    if(state.authType === "digest") {
        if(data.username.length < 1) {
            isValid = false;
            v.username.invalid = true;
            v.username.feedback = "Username is required";
        }

        if(data.password.length < 1) {
            isValid = false;
            v.password.invalid = true;
            v.password.feedback = "Password is required";
        }
    } else {
        if(data.api_key.length < 1) {
            isValid = false;
            v.api_key.invalid = true;
            v.api_key.feedback = "API key is required";
        }
    }

    state.setValidation(validationResult);
    return isValid;
}

export default LoginPage;
