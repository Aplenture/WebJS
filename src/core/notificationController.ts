import { ViewController } from "./viewController";
import { Label } from "../views/label";
import { BodyViewController, StackViewController } from "../viewControllers";
import { Fifo, Localization, Milliseconds, sleep } from "corejs";
import { Clipboard } from "./clipboard";

const DEFAULT_DURATION_NOTIFICATION = 3 * Milliseconds.Second;

interface Notification {
    readonly text: string;
    readonly title?: string;
    readonly duration?: number;
    readonly important?: boolean;
}

export abstract class NotificationController {
    private static readonly notifications = new Fifo<Notification>();

    private static viewController: ViewController;
    private static stackViewController: StackViewController;

    private static initialized = false;
    private static currentNotification: Notification = null;

    public static async init() {
        if (this.initialized)
            throw new Error('NotificationController is already initialized');

        this.initialized = true;
        this.viewController = new ViewController('notification-view-controller');
        this.stackViewController = new StackViewController();

        this.viewController.appendChild(this.stackViewController);

        this.stackViewController.onPush.on(() => !(this.viewController.view as any).div.parentNode && document.body.appendChild((this.viewController.view as any).div));
        this.stackViewController.onPop.on(() => 0 == this.stackViewController.children.length && (this.viewController.view as any).div.parentNode && document.body.removeChild((this.viewController.view as any).div));

        Clipboard.onCopy.on(key => this.pushNotification({ text: Localization.translate('#_clipboard_copy_text', { '$1': key }), title: '#_clipboard_copy_title' }));

        await this.viewController.load();
    }

    public static async pushNotification(notification: Notification): Promise<void> {
        this.notifications.push(notification);

        if (!this.currentNotification || !this.currentNotification.important)
            this.next();
    }

    public static pushError(error: Error, title = '#_error', duration?: number): Promise<void> {
        return this.pushNotification({ text: error.message, title, duration, important: true });
    }

    private static async next() {
        this.currentNotification = this.notifications.pop();

        if (!this.currentNotification) {
            await this.stackViewController.popViewController();
            return;
        }

        const viewController = new BodyViewController('notification-body-view-controller');
        const textLabel = new Label('text');

        viewController.titleBar.title = this.currentNotification.title;
        viewController.footerBar.isHidden = true;
        viewController.contentView.appendChild(textLabel);
        viewController.load();

        textLabel.text = this.currentNotification.text;

        await this.stackViewController.popViewController();

        this.stackViewController.pushViewController(viewController);

        await sleep(this.currentNotification.duration || DEFAULT_DURATION_NOTIFICATION);

        this.next();
    }
}