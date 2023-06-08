import { parseToString } from "corejs";
import { Request, RequestOptions } from "../core/request";

export class TextRequest<TParams> extends Request<TParams, string> {
    constructor(api: string, options?: RequestOptions) {
        super(api, parseToString, options);
    }
}