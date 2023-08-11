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

import { Breadcrumb } from "react-bootstrap";
import { useLocation, Link } from "react-router-dom";
import APIGroupPage from "./APIGroupPage";
import APIObjectListPage from "./APIObjectListPage";
import APIObjectPage from "./APIObjectPage";
import NotFoundPage from "./NotFoundPage";

function APIRoutePage({config}) {
    const path = useLocation().pathname;

    let route = config.routes;
    let title = route.title;
    let routePath = [{path: "/", title: title}];
    let currentPath = "";
    let objectKey = {};
    let navigation = route.navigation;

    if(path !== "/") {
        let pathComponents = path
            .replace(/^\/|\/$/g, "")
            .split("/");

        for(const c of pathComponents) {
            if("routes" in route) {
                if(!(c in route.routes)) {
                    return(<NotFoundPage/>);
                }

                route = route.routes[c];
                navigation = route.navigation;
                title = route.title;
            } else if("object" in route) {
                const routeObject = route.object;
                const apiObject = config.api.objects[routeObject.name];

                if("get_by_id" in apiObject && !apiObject.get_by_id) {
                    return(<NotFoundPage/>);
                }

                objectKey[routeObject.name] = decodeURIComponent(c);

                route = routeObject;
                title = decodeURIComponent(c);
            } else {
                return(<NotFoundPage/>);
            }

            currentPath = `${currentPath}/${c}`;
            routePath.push({path: currentPath, title: title});
        }
    }

    return(
        <>
        {routePath.length > 1 && <Breadcrumb>
            {
                routePath.map((r, i) => {
                    if(i < routePath.length - 1) {
                        return <Breadcrumb.Item><Link to={ r.path }>{ r.title }</Link></Breadcrumb.Item>
                    } else {
                        return <Breadcrumb.Item active>{ r.title }</Breadcrumb.Item>
                    }
                })
            }
        </Breadcrumb>}
        { "navigation" in route &&
            <APIGroupPage
                title={ title }
                route={ route }
                config={ config }
                path={ currentPath }/> }
        { "object" in route &&
            <APIObjectListPage
                title={ title }
                key={ route.object.name }
                objectType={ {"route": route.object, "api": config.api.objects[route.object.name]}, "navigation": navigation}
                path={ currentPath }
                config={ config }/> }
        { "fields" in route &&
            <APIObjectPage
                title={ title }
                objectKey={ objectKey }
                objectType={ {"route": route, "api": config.api.objects[route.name], "navigation": navigation} }
                path={ currentPath }
                parentPath={ routePath.at(-2).path }
                config={ config }/>}
        </>
    );
}

export default APIRoutePage;
