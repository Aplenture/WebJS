import { parseToBool } from "corejs";
import { Request, RequestOptions } from "../core/request";

export class BoolRequest<TParams> extends Request<TParams, boolean> {
    constructor(api: string, options?: RequestOptions) {
        super(api, parseToBool, options);
    }
}