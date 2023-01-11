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

function NavigationAPIRoute({route, path="", activePath="", depth=0}) {
    return(
        <>
        { route.navigation.map((link, index) => {
            const linkPath = `${path}/${link}`;
            const linkRoute = route.routes[link];

            let text = <>{ linkRoute.title }</>;
            if(depth === 0) {
                text = <b>{ text }</b>;
            }

            let className = "nav-link";
            if(linkPath === activePath) {
                className = `${className} active`;
            }

            return(<>
            <Link
                to={ linkPath }
                className={ className }
                style={ {
                    "paddingLeft": `${depth + 1}rem`,
                    "marginBottom": `${index === route.navigation.length - 1 ? "0.5" : "0"}rem`
                } }>
                { text }
            </Link>
            { "navigation" in linkRoute && <NavigationAPIRoute
                route={ linkRoute }
                path={ linkPath }
                activePath={ activePath }
                depth={ depth + 1 }/> }
            </>);
        })}
        </>
    )
}

export default NavigationAPIRoute;
