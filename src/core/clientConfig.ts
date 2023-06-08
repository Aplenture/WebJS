import { Config } from "corejs";
import { JSONRequest } from "../requests";

export class ClientConfig extends Config {
    private _initialized = false;

    constructor(
        public readonly name: string,
        public readonly path = '/' + name
    ) {
        super();

        if (window[name])
            throw new Error(`window.${name} is set already`);

        window[name] = this;
    }

    public get initialized(): boolean { return this._initialized; }

    public static get(name: string): Config {
        if (!(window[name] instanceof Config))
            throw new Error(`window.${name} is not an instance of config`);

        return window[name];
    }

    public async init() {
        if (this._initialized)
            throw new Error(`config ${this.name} is already initialized`);

        const data = await new JSONRequest(this.path).send();

        this._initialized = true;
        this.data = Config.flatten(data);
    }
}