import { Config, Event, Localization } from "corejs";
import { JSONRequest } from "../requests";
import { WebConfig } from "./webConfig";
import { NotificationController } from "./notificationController";
import { PopupController } from "./popupController";
import { Router } from "./router";
import { Server } from "./server";
import { ViewController } from "./viewController";

const KEY_DEBUG = 'debug';

interface Options {
    readonly configs?: readonly WebConfig[];
    readonly servers?: readonly Server[];
    readonly translations?: readonly (NodeJS.ReadOnlyDict<string> | string)[];
}

export abstract class Client {
    public static readonly onLoaded = new Event<void, void>('Web.onLoaded');
    public static readonly onResize = new Event<void, void>('Web.onResize');

    private static _initialized = false;
    private static _rootViewController: ViewController;
    private static _config: Config;

    public static get rootViewController(): ViewController { return this._rootViewController; }

    public static get title(): string { return document.title; }
    public static set title(value: string) { document.title = value; }

    public static get language(): string { return window.navigator.language; }

    public static get width(): number { return window.innerWidth; }
    public static get height(): number { return window.innerHeight; }

    public static get debug(): boolean { return this._config.get(KEY_DEBUG); }
    public static get config(): Config { return this._config; }

    public static async init(rootViewController: new () => ViewController, config: WebConfig, options?: Options) {
        if (this._initialized)
            throw new Error('Web is already initialized');

        this._initialized = true;
        this._config = config;

        if (options.configs)
            await Promise.all(options.configs.map(element => element.init()));

        if (!config.initialized)
            await config.init();

        Event.onEmit.on((args, sender) => this.debug && console.log(sender.name, args));
        Localization.onMissingTranslation.on(key => this.debug && console.warn(`missing translation for key '${key}'`));

        await PopupController.init();
        await NotificationController.init();

        window.addEventListener('unhandledrejection', event => PopupController.pushError(event.reason || '#_something_went_wrong'));
        window.addEventListener('resize', () => this.onResize.emit());

        await this.loadTranslations(options.translations);

        this._rootViewController = new rootViewController();

        document.body.appendChild((this.rootViewController.view as any).div);

        if (document.readyState === 'complete')
            await this.handleLoaded(options);
        else
            window.addEventListener('load', () => this.handleLoaded(options), { once: true });
    }

    protected static async handleLoaded(options: Options = {}) {
        Router.init(this._config);

        if (options.servers)
            await Promise.all(options.servers.map(element => element.init()));

        await this.rootViewController.load();

        this.onLoaded.emit();

        Router.reload();
    }

    private static async loadTranslations(data: readonly (NodeJS.ReadOnlyDict<string> | string)[] = []): Promise<void> {
        for (let i = 0; i < data.length; ++i) {
            if (data[i] instanceof String)
                try { Localization.load(await new JSONRequest<void, any>(data[i] as string).send()); } catch (error) { }
            else
                Localization.load(data[i] as NodeJS.ReadOnlyDict<string>);
        }
    }
}