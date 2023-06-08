import { ViewController } from "../core";

export class ContainerViewController extends ViewController {
    public readonly contentViewController = new ViewController('content');

    constructor(...classes: string[]) {
        super(...classes, 'container-view-controller');

        super.appendChild(this.contentViewController);
    }

    public get children(): readonly ViewController[] { return this.contentViewController.children; }

    public appendChild(child: ViewController): number {
        return this.contentViewController.appendChild(child);
    }

    public removeChild(child: ViewController): number {
        return this.contentViewController.removeChild(child);
    }

    public removeChildAtIndex(index: number): ViewController {
        return this.contentViewController.removeChildAtIndex(index);
    }

    public removeAllChildren() {
        return this.contentViewController.removeAllChildren();
    }
}