import { Event, RequestMethod, encodeString, ResponseCode } from "corejs";

export interface RequestOptions {
    readonly endpoint?: string;
    readonly type?: RequestMethod;
    readonly useCredentials?: boolean;
    readonly headers?: NodeJS.ReadOnlyDict<string>;
}

export class Request<TParams, TResponse> {
    public readonly onSending = new Event<Request<any, any>, string>('Request.onSending');

    public readonly url: string;
    public readonly type: RequestMethod;

    private readonly request = new XMLHttpRequest();

    private _running = false;

    constructor(
        api: string,
        private readonly parser: (data: string) => TResponse,
        options: RequestOptions = {}
    ) {
        this.url = (options.endpoint || '') + api;
        this.type = options.type || RequestMethod.Get;
        this.request.withCredentials = options.useCredentials || false;

        if (options.headers)
            Object.keys(options.headers).forEach(name => this.setHeader(name, options.headers[name]));
    }

    public get isRunning(): boolean { return this._running; }

    public send(params?: TParams): Promise<TResponse> {
        for (const key in params)
            if (undefined === params[key])
                delete params[key];

        if (this._running)
            throw new Error(`request '${this.url}' is running already`);

        this._running = true;

        return new Promise<TResponse>((resolve, reject) => {
            this.request.onreadystatechange = () => {
                if (this.request.readyState !== 4)
                    return;

                this._running = false;

                switch (this.request.status) {
                    case ResponseCode.OK: {
                        let result: TResponse;

                        try {
                            result = this.parser(this.request.responseText);
                        } catch (error) {
                            return reject(error);
                        }

                        return resolve(result);
                    }

                    case ResponseCode.NoContent:
                        return resolve(null);

                    case 0:
                        return reject(new Error('#_server_not_responding'));

                    default:
                        return reject(new Error(this.request.responseText || '#_something_went_wrong'));
                }
            };

            const paramString = this.paramsToString(params);
            const uri = this.createURI(paramString, this.url);
            const body = this.createBody(paramString);

            this.request.open(this.type, uri, true);
            this.request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

            this.onSending.emit(this, paramString);

            this.request.send(body);
        });
    }

    public setHeader(name: string, value: string) {
        this.request.setRequestHeader(name, value);
    }

    protected paramsToString(params: NodeJS.Dict<any> = {}): string {
        if (!params)
            return '';

        const args = [];

        for (const key in params) {
            if (typeof params[key] == 'boolean')
                args.push(`${key}=${params[key] ? 1 : 0}`);
            else if (Array.isArray(params[key]))
                (params[key] as any).forEach(value => args.push(`${key}=${encodeString(value)}`));
            else
                args.push(`${key}=${encodeString(params[key] as any)}`)
        }

        return args.join('&');
    }

    protected createURI(params: string, url: string): string {
        let result = '';

        switch (this.type) {
            case RequestMethod.Get:
                result += params
                    ? url + "?" + params
                    : url;
                break;

            default:
                result += url;
                break;
        }

        return result;
    }

    protected createBody(params: string): any {
        switch (this.type) {
            case RequestMethod.Post:
                return params;

            default:
                return "";
        }
    }
}