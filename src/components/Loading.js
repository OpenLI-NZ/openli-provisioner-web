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

import { Spinner, Stack } from "react-bootstrap";

function Loading({message, gap=2}) {
    return(
        <Stack gap={ gap } className="align-items-center justify-content-center" style={{overflow: "hidden"}}>
            <Spinner animation="border" role="status"/>
            { message && <span>{ message }</span> }
        </Stack>
    );
}

export default Loading;
