import { ViewController } from "../core";

export interface INavigationViewController {
    pushViewController(viewController: ViewController): Promise<void>;
    popViewController(): Promise<ViewController>;
}