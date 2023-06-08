import { parseToNumber } from "corejs";
import { Request, RequestOptions } from "../core/request";

export class NumberRequest<TParams> extends Request<TParams, number> {
    constructor(api: string, options?: RequestOptions) {
        super(api, parseToNumber, options);
    }
}