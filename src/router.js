class Router {
    constructor(routes) {
        this.routes = routes;
        this.queryParams = this.parseQueryParams();
        window.onpopstate = this.routeChanged.bind(this);
    }

    routeChanged() {
        const path = window.location.pathname;
        const route = this.routes.find(r => r.path === path);
        if (route) {
            const component = document.createElement(route.component.selector);

            document.getElementById('app').innerHTML = '';
            document.getElementById('app').appendChild(component);
        }
    }

    parseQueryParams() {
        const queryParams = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams.entries()) {
            queryParams[key] = value;
        }
        return queryParams;
    }

    navigate(path, queryParams = {}) {
        const searchParams = new URLSearchParams();
        for (const key in queryParams) {
            searchParams.set(key, queryParams[key]);
        }
        const queryString = searchParams.toString();
        const newUrl = path + (queryString ? `?${queryString}` : '');
        history.pushState(null, '', newUrl);
        this.queryParams = queryParams; // Update the stored queryParams
        this.routeChanged();
    }
}
