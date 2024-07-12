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

import { Link } from "react-router-dom";
import { isNavigationAPISupported } from "../utilities/api"

function APIGroupPage({title, route, config, path=""}) {
    return(
        <>
        <h1>{ title }</h1>
        <ul>
            { route.navigation.map((link) => {
                if (isNavigationAPISupported(link.minversion,
                        config.openliversion, link.maxversion)) {

                    return(<li><Link to={ `${path}/${link.link}` }>{ route.routes[link.link].title }</Link></li>);
                } else {
                    return (<></>);
                }
            })}
        </ul>
        </>
    )
}

export default APIGroupPage;
