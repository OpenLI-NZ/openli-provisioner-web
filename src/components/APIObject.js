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

import { Table, Stack } from "react-bootstrap";
import { fieldLabel } from "../utilities/api";

function APIObject({fields, data}) {
    return(
        <Table>
            <tbody>
                { fields.route.map((f) => {
                    const field = {"route": f, "api": fields.api[f.name]}
                    const label = fieldLabel(field.route);
                    const key = field.route.name;

                    if(key in data) {
                        return(
                            <tr>
                                <td className="col-auto" style={ {"white-space": "nowrap"} }><b>{ label }</b></td>
                                <td className="w-100"><APIObjectField field={ field } data={ data[key] }/></td>
                            </tr>
                        );
                    } else {
                        return(<></>);
                    }
                }) }
            </tbody>
        </Table>
    )
}

function APIObjectField({field, data}) {
    const type = field.api.type;

    if(type === "dict") {
        return(<APIObject
            fields={ {"route": field.route.fields, "api": field.api.fields} }
            data={ data }/>);
    } else if(type === "list") {
        return(
            <Stack>
            { data.map((d) => (
                <APIObjectField
                    field={ {"route": field.route.elements, "api": field.api.elements} }
                    data={ d }/>
            ))}
            </Stack>
        );
    } else {
        return(<span>{ data }</span>);
    }
}

export default APIObject;
export { APIObjectField };
