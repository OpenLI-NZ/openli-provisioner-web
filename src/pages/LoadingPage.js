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

import { Stack, Spinner } from "react-bootstrap";
import Message from "../components/Message";
import { getErrorMessage } from "../utilities/errors";

function LoadingPage({isLoading=false, message="", error=null}) {
    let element = <></>
    if(isLoading) {
        element = <>
            <Spinner animation="border" role="status"/>
            { message && <span>{ message }</span> }
        </>;
    } else if(error) {
        element = <Message variant="danger" message={ getErrorMessage(error) }/>;
    }

    return(
        <Stack gap={ 3 } className="align-items-center justify-content-center p-3">
            <h1>OpenLI Provisioner</h1>
            { element }
        </Stack>
    )
}

export default LoadingPage;
