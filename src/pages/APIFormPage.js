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

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button, Form, Spinner, Tooltip, OverlayTrigger } from "react-bootstrap";
import { InfoIcon } from "@primer/octicons-react";
import Message from "../components/Message";
import { dataGet, dataSet, deepCopyJSON, dataTrim, pathJoin } from "../utilities/utils";
import {
    initialiseAPIData,
    initialAPIDataValue,
    validateAPIData,
    initialAPIValidationValue,
    fieldLabel,
    formatAPIData,
    toAPIObject
} from "../utilities/api";
import { useRequestJSON, useGetRequestJSON } from "../utilities/requests";
import { getErrorMessage } from "../utilities/errors";

const inputTypeMap = {
    "str": "text",
    "int": "number",
    "number": "number",
    "bool": "checkbox",
    "unix_timestamp": "datetime-local",
    "ip": "text",
    "port": "number",
    "ip_range": "text",
    "email": "text",
    "select": "select",
    "agencylist": "agencylist",
}

function APIFormPage({objectType, cancelCallback, config, object=null}) {
    const initialObject = useMemo(() => object ?
        formatAPIData(objectType.api.fields, toAPIObject(objectType, deepCopyJSON(object)), true) :
        null,
    [object, objectType]);

    const initialData = useMemo(() => initialiseAPIData(
        objectType.api.fields,
        object ? deepCopyJSON(initialObject) : {}
    ), [object, objectType, initialObject]);
    const [data, setData] = useState(initialData);

    const [, initialValidation] = useMemo(() => validateAPIData(
        objectType.api.fields,
        object ? deepCopyJSON(initialObject) : {}
    ), [object, objectType, initialObject]);
    const [validation, setValidation] = useState(initialValidation);

    const [error, setError] = useState("");
    const [showError, setShowError] = useState(false);

    const callback = useCallback((_, error) => {
        if(error) {
            setError(getErrorMessage(error));
            setShowError(true);
        } else {
            cancelCallback();
        }
    }, [cancelCallback, setError, setShowError]);

    const method = object ? "PUT" : "POST";
    const path = "/" + pathJoin(["api", objectType.api.path]);
    const request = useRequestJSON(path, method, callback);

    const state = {
        "data": deepCopyJSON(data),
        "setData": setData,
        "validation": deepCopyJSON(validation),
        "setValidation": setValidation,
        "method": method,
        "objectType": objectType,
        "request": request
    };

    return(
        <Form onSubmit={ (event) => {
            setShowError(false);
            handleSubmit(event, state);
        }}>
            <APIFormFields
                fields={ {"route": objectType.route.fields, "api": objectType.api.fields} }
                state={ state }/>
            <div className="btn-row">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={ cancelCallback }>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={ request.isLoading }>
                    { request.isLoading ?
                        <Spinner animation="border" size="sm" role="status"/> :
                        "Submit" }
                </Button>
            </div>
            <Message
                variant="danger"
                message={ error }
                show={ showError }
                setShow={ setShowError }/>
        </Form>
    );
}

function APIFormFields({fields, fieldKey=[], state}) {
    return(
        <>
        { fields.route.map((f) => {
            const field = {"route": f, "api": fields.api[f.name]}
            const label = fieldLabel(field.route);
            const type = field.api.type || "str";
            const key = fieldKey.concat([field.route.name]);
            const infoicon =
                    ({ ref, ...triggerHandler }) => (
                        <span ref={ref} {...triggerHandler}>
                        <InfoIcon
                            className="info-tooltip-icon" size={16}
                            verticalAlign="middle"/>
                        </span>
                    );

            const rendertip = (props) => (
                    <Tooltip className="show" {...props}>
                        {field.api.helptext}
                    </Tooltip>);

            const requiredLabel = field.api.required ?
                <span className="text-danger">*</span> :
                <></>;

            const tipOverlay = field.api.helptext ?
                        (<OverlayTrigger placement="right" overlay={rendertip}>
                        {infoicon}
                        </OverlayTrigger>) : <></>;

            if(type === "dict") {
                return(
                    <div>
                        <label>{ label }{ requiredLabel }</label>
                        {tipOverlay}
                        <div className="api-form-collection">
                            <APIFormDict
                                field={ field }
                                fieldKey={ key }
                                state={ state }/>
                        </div>
                    </div>
                );
            } else if(type === "list") {
                return(
                    <div>
                        <label>{ label }{ requiredLabel }</label>
                        {tipOverlay}
                        <APIFormList
                            field={ field }
                            fieldKey={ key }
                            state={ state }/>
                    </div>
                );
            } else if (type === "agencylist") {
                const id = "input_" + key.join("_");
                return (
                    <div className="form-group">
                        <label for={ id }>{ label }{ requiredLabel }</label>
                        {tipOverlay}
                        <APIFormAgencyList
                            id={ id }
                            field={ field }
                            label={ label }
                            fieldKey={ key }
                            state={ state } />
                    </div>
                );
            } else if (type === "select") {
                const id = "input_" + key.join("_");
                return (
                    <div className="form-group">
                        <label for={ id }>{ label }{ requiredLabel }</label>
                        {tipOverlay}
                        <APIFormSelect
                            id={ id }
                            field={ field }
                            label={ label }
                            fieldKey={ key }
                            state={ state } />
                    </div>
                );
            } else {
                const id = "input_" + key.join("_");
                return(
                    <div className="form-group">
                        <label for={ id }>{ label }{ requiredLabel }</label>
                        {tipOverlay}
                        <APIFormInput
                            type={ type }
                            id={ id }
                            label={ label }
                            fieldKey={ key }
                            state={ state }/>
                    </div>
                );
            }
        }) }
        </>
    );
}

function APIFormSelect({id, field, label, fieldKey, state}) {
    const value = dataGet(state.data, fieldKey);
    const validation = dataGet(state.validation, fieldKey);
    const options = field.api.choices.map(
            opt => <option key={opt} value={opt}>{opt}</option>);

    const disabled = (state.method === "PUT" &&
        state.objectType.api.key.includes(fieldKey[0])) ||
        state.request.isLoading;

    let element = (<Form.Select
        type={ "text" }
        id={ id }
        defaultValue={ value ? value : field.api.defaultval }
        onChange={ (event) => handleChange(event, fieldKey, state) }
        disabled={ disabled }
        isInvalid={ validation.invalid }
        >
        {options}
        </Form.Select>);

    return(
        <>
        { element }
        { validation.invalid && <Form.Control.Feedback type="invalid">
            { label } { validation.feedback }
        </Form.Control.Feedback> }
        </>
    )
}

function APIFormAgencyList({id, field, label, fieldKey, state}) {

    const value = dataGet(state.data, fieldKey);
    const disabled = state.request.isLoading;
    const validation = dataGet(state.validation, fieldKey);

    const [agencies, setAgencies] = useState([]);
    const [defaultValue, setDefaultValue] = useState("");

    const requestCallback = useCallback((data, _) => {
        if (data) {
            setAgencies(data);
            setDefaultValue(data[0].agencyid);
            dataSet(state.data, fieldKey, data[0].agencyid);
            state.setData(state.data);
        }
    }, [setAgencies, fieldKey, state]);

    const request = useGetRequestJSON("/" + pathJoin(["api", "/agency"]), requestCallback);
    const requestStarted = useRef(false);

    useEffect(() => {
        if (!requestStarted.current) {
            request.start();
        }
        if (!requestStarted.current) {
            requestStarted.current = true;
        }
    }, [request]);

    let element = (<Form.Select
        type={ "text" }
        id={ id }
        defaultValue={ value ? value : defaultValue }
        onChange={ (event) => handleChange(event, fieldKey, state) }
        disabled={ disabled }
        isInvalid={ validation.invalid }
        >
        {agencies.map((ag) => {
            return (
                <option key={ag.agencyid} value={ag.agencyid}>
                    {ag.agencyid}
                </option>
            );
        })}
        </Form.Select>);

    return(
        <>
        { element }
        { validation.invalid && <Form.Control.Feedback type="invalid">
            { label } { validation.feedback }
        </Form.Control.Feedback> }
        </>
    )
}

function APIFormInput({type, id, label, fieldKey, state}) {
    const inputType = inputTypeMap[type] || "text";
    const value = dataGet(state.data, fieldKey);
    const validation = dataGet(state.validation, fieldKey);
    const disabled =
        (state.method === "PUT" &&
        state.objectType.api.key.includes(fieldKey[0])) ||
        state.request.isLoading;

    let element = (<Form.Control
        type={ inputType }
        id={ id }
        onChange={ (event) => handleChange(event, fieldKey, state) }
        disabled={ disabled }
        isInvalid={ validation.invalid }/>);

    if(inputType === "checkbox") {
        element = (<Form.Check
            { ...element.props }
            checked={ value }/>);
    } else {
        element = (<Form.Control
            { ...element.props }
            placeholder={ label }
            value={ value }/>);
    }

    if(inputType === "number") {
        element = (<Form.Control
            { ...element.props }
            step="any"
            onWheel={ (event) => event.target.blur() }/>);
    }

    if(inputType === "datetime-local") {
        element = (<Form.Control
            { ...element.props }
            step="1"/>);
    }
    return(
        <>
        { element }
        { validation.invalid && <Form.Control.Feedback type="invalid">
            { label } { validation.feedback }
        </Form.Control.Feedback> }
        </>
    )
}

function APIFormDict({field, fieldKey, state}) {
    return(<APIFormFields
        fields={ {"route": field.route.fields, "api": field.api.fields} }
        fieldKey={ fieldKey }
        state={ state }/>);
}

function APIFormList({field, fieldKey, state}) {
    const value = dataGet(state.data, fieldKey);
    const validation = dataGet(state.validation, fieldKey);
    const type = field.api.elements.type || "str";

    let enableDelete = true;
    if(field.api.required && value.length <= 1) {
        enableDelete = false;
    }

    return(
        <div className="api-form-collection">
            { value.map((item, index) => {
                const key = fieldKey.concat([index]);

                let element = null;
                if(type === "dict") {
                    element = (
                        <div>
                            <APIFormDict
                                field={ {"route": field.route.elements, "api": field.api.elements} }
                                fieldKey={ key }
                                state={ state }/>
                        </div>
                    );
                } else if(type === "list") {
                    element = (
                        <APIFormList
                            field={ {"route": field.route.elements, "api": field.api.elements} }
                            fieldKey={ key }
                            state={ state }/>
                    );
                } else {
                    const id = "input_" + fieldKey.join("_");
                    const label = field.route.elements.label || "";
                    element = (
                        <div className="form-group">
                            <APIFormInput
                                type={ type }
                                id={ id }
                                label={ label }
                                fieldKey={ key }
                                state={ state }/>
                        </div>
                    );
                }

                let className = "";
                if(index < value.length - 1) {
                    className = "mb-3";
                } else {
                    className = "me-1";
                }

                return(
                    <>
                    { element }
                    { enableDelete && <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        style={ {"width": "2rem"} }
                        className={ className }
                        disabled={ state.request.isLoading }
                        onClick={ () => {
                            value.splice(index, 1);
                            state.setData(state.data);
                            validation.splice(index, 1);
                            state.setValidation(state.validation);
                        }}
                    ><b>-</b></Button> }
                    </>
                );
            }) }
            <Button
                type="button"
                variant="success"
                size="sm"
                style={ {"width": "2rem"} }
                disabled={ state.request.isLoading }
                onClick={ () => {
                    validation.push(initialAPIValidationValue(field.api.elements));
                    state.setValidation(state.validation);
                    value.push(initialAPIDataValue(field.api.elements));
                    state.setData(state.data);
                }}
            ><b>+</b></Button>
        </div>
    )
}

function prepareData(state) {
    let result = deepCopyJSON(state.data);
    result = dataTrim(result);
    result = formatAPIData(state.objectType.api.fields, result);
    return result;
}

function handleChange(event, fieldKey, state) {
    const type = event.target.type;
    const value = type === "checkbox" ? event.target.checked : event.target.value;
    dataSet(state.data, fieldKey, value);
    state.setData(state.data);
}

function handleSubmit(event, state) {
    event.preventDefault();

    const [isValid, validation] = validateAPIData(state.objectType.api.fields, state.data);

    state.setValidation(validation);

    if(isValid) {
        state.request.start(prepareData(state));
    }
}

export default APIFormPage;
