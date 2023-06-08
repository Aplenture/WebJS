import { Request, RequestOptions } from "../core/request";

export class JSONRequest<TParams, TResponse> extends Request<TParams, TResponse> {
    constructor(api: string, options?: RequestOptions) {
        super(api, JSON.parse, options);
    }
}