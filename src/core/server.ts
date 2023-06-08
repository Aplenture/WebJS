import * as CoreJS from "corejs";
import { Request } from "./request";
import { Session } from "./session";

interface RequestOptions<T> {
    readonly isPrivate?: boolean;
    readonly type: CoreJS.RequestMethod;
    readonly parser: (data: string) => T
}

export class Server extends CoreJS.Server {
    public readonly session = new Session(this);

    public get endpoint(): string { return this.config.get('endpoint'); }

    public ping(): Promise<string> {
        return this.get('ping');
    }

    public info(): Promise<string> {
        return this.get('info');
    }

    protected get<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            type: CoreJS.RequestMethod.Get,
            parser: CoreJS.parseToString
        });
    }

    protected getNumber<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            type: CoreJS.RequestMethod.Get,
            parser: CoreJS.parseToNumber
        });
    }

    protected getBool<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            type: CoreJS.RequestMethod.Get,
            parser: CoreJS.parseToBool
        });
    }

    protected getJSON<TArgs, TResponse>(configAPIKey: string, args?: TArgs) {
        return this.request<TResponse>(configAPIKey, args, {
            type: CoreJS.RequestMethod.Get,
            parser: JSON.parse
        });
    }

    protected post<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            type: CoreJS.RequestMethod.Post,
            parser: CoreJS.parseToString
        });
    }

    protected postNumber<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            type: CoreJS.RequestMethod.Post,
            parser: CoreJS.parseToNumber
        });
    }

    protected postBool<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            type: CoreJS.RequestMethod.Post,
            parser: CoreJS.parseToBool
        });
    }

    protected postJSON<TArgs, TResponse>(configAPIKey: string, args?: TArgs) {
        return this.request<TResponse>(configAPIKey, args, {
            type: CoreJS.RequestMethod.Post,
            parser: JSON.parse
        });
    }

    protected getPrivate<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Get,
            parser: CoreJS.parseToString
        });
    }

    protected getPrivateNumber<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Get,
            parser: CoreJS.parseToNumber
        });
    }

    protected getPrivateBool<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Get,
            parser: CoreJS.parseToBool
        });
    }

    protected getPrivateJSON<TArgs, TResponse>(configAPIKey: string, args?: TArgs) {
        return this.request<TResponse>(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Get,
            parser: JSON.parse
        });
    }

    protected postPrivate<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Post,
            parser: CoreJS.parseToString
        });
    }

    protected postPrivateNumber<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Post,
            parser: CoreJS.parseToNumber
        });
    }

    protected postPrivateBool<TArgs>(configAPIKey: string, args?: TArgs) {
        return this.request(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Post,
            parser: CoreJS.parseToBool
        });
    }

    protected postPrivateJSON<TArgs, TResponse>(configAPIKey: string, args?: TArgs) {
        return this.request<TResponse>(configAPIKey, args, {
            isPrivate: true,
            type: CoreJS.RequestMethod.Post,
            parser: JSON.parse
        });
    }

    private request<T>(configAPIKey: string, args = {}, options: RequestOptions<T>) {
        if (options.isPrivate && !this.session.access)
            throw new Error('#_error_no_access');

        const api = this.config.get<string>(`api.${configAPIKey}`);
        const request = new Request(api, options.parser, {
            endpoint: this.endpoint,
            type: options.type,
            useCredentials: false
        });

        if (options.isPrivate) {
            args['timestamp'] = Date.now();

            request.onSending.once((params, request) => {
                request.setHeader(CoreJS.RequestHeader.APIKey, this.session.access.api);
                request.setHeader(CoreJS.RequestHeader.Signature, this.session.access.sign(params));
            });
        }

        return request.send(args);
    }
}