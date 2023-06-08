import { View } from "../core";

export class Bar extends View {
    constructor(...classes: string[]) {
        super(...classes, 'bar-view');
    }
}