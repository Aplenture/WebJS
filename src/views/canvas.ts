import { View } from "../core";

export class Canvas extends View {
    protected readonly canvas = document.createElement('canvas');

    constructor(...classes: readonly string[]) {
        super(...classes, 'canvas-view');

        this.div.appendChild(this.canvas);
    }
}