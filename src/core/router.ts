import { Config, Lifo, Event, EventHandler } from "corejs";
import { Route } from "./route";

const KEY_ROUTE_DEFAULT = 'routes.default';

export abstract class Router {
    public static readonly onRouteChanged = new Event<void, Route>('Router.onRouteChanged');

    private static readonly _routes: Route[] = [];
    private static readonly _history = new Lifo<string>();

    private static _initialized = false;
    private static _config: Config;
    private static _route: Route = null;

    public static get initialized(): boolean { return this._initialized; }
    public static get route(): Route { return this._route; }

    public static get index(): number { return this._route && this._route.index; }
    public static get historyLength(): number { return this._history.count; }

    public static init(config: Config) {
        if (this._initialized)
            throw new Error('Router is already initialized');

        this._initialized = true;
        this._config = config;

        window.addEventListener('popstate', async () => {
            this._history.pop();
            this.setupRoute();
            Router.onRouteChanged.emit(null, this._route);
        });

        this.setupRoute();
    }

    public static addRoute(route: Route, onRouteChanged?: EventHandler<void, Route>) {
        this._routes.push(route);

        if (onRouteChanged)
            Router.onRouteChanged.on(onRouteChanged, { args: route });
    }

    public static changeRoute(name: string, index: number = null) {
        const route = this.findRoute(name, index);

        if (this._route && route.name == this._route.name && route.index == this._route.index)
            return;

        const routeString = route.toString();

        this._history.push(routeString);
        window.history.pushState({}, route.name, routeString);

        this._route = route;

        Router.onRouteChanged.emit(null, route);
    }

    public static back() {
        if (this._history.count) {
            window.history.back();
        } else {
            const route = this.findRoute();

            if (this._route && route.name == this._route.name && route.index == this._route.index)
                return;

            this._route = route;

            Router.onRouteChanged.emit(null, route);
        }
    }

    public static reload() {
        Router.onRouteChanged.emit(null, this._route);
    }

    private static setupRoute() {
        const routeParts = window.location.pathname.split('/');

        this._route = this.findRoute(routeParts[1], parseInt(routeParts[2]));

        if (this._route.name != routeParts[1])
            window.history.replaceState({}, this._route.name, this._route.toString());
    }

    private static findRoute(name = this._config.get(KEY_ROUTE_DEFAULT), index?: number) {
        const route = this._routes.find(route => route.name == name)
            || ((name = this._config.get(KEY_ROUTE_DEFAULT)) && this._routes.find(route => route.name == name))
            || this._routes[0];

        if (!route)
            throw new Error('#_no_routes');

        (route as any).index = index && !isNaN(index)
            ? index
            : null;

        route.init();

        return route;
    }
}