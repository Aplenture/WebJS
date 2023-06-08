import { EC, ECDSA, toHashInt, Event } from "corejs";
import { Access } from "./access";
import { Router } from "./router";
import { Server } from "./server";

const API_HAS_ACCESS = 'hasAccess';
const API_LOGIN = 'login';
const API_LOGOUT = 'logout';
const API_CHANGE_PASSWORD = 'changePassword';
const API_GET_ACCESSES = 'getAccesses';
const API_CREATE_ACCESS = 'createAccess';
const API_DELETE_ACCESS = 'deleteAccess';

interface CreateAccessOptions {
    readonly rights?: number;
    readonly label?: string;
    readonly expiration_duration?: number;
}

interface TestAccessData {
    readonly api: string;
    readonly secret: string;
}

interface AccessData {
    readonly id: number;
    readonly created: number;
    readonly account: number;
    readonly api: string;
    readonly secret: string;
    readonly rights: number;
    readonly expiration?: number;
    readonly label?: string;
}

export class Session {
    public readonly onAccessChanged = new Event<Session, Access>('Session.onAccessChanged');
    public readonly onLogin = new Event<Session, Access>('Session.onLogin');
    public readonly onLogout = new Event<Session, void>('Session.onLogout');

    private readonly accessKey = this.server.name + '.access';
    private readonly apiKey = this.server.name + '.api';
    private readonly secretKey = this.server.name + '.secret';

    private _access: Access = null;

    public get access(): Access { return this._access; }
    public get hasAccess(): boolean { return !!this._access; }

    constructor(public readonly server: Server) { }

    public async init() {
        this._access = await this.parameterizedAccess()
            || await this.deserializeAccess();

        Router.route.delete(this.apiKey);
        Router.route.delete(this.secretKey);
    }

    public updateAccess(access: Access, keepLogin?: boolean) {
        this._access = access;
        this.serializeAccess(access, keepLogin);
        this.onAccessChanged.emit(this, access);
    }

    public resetAccess() {
        this._access = null;

        window.localStorage.removeItem(this.accessKey);
        window.sessionStorage.removeItem(this.accessKey);

        this.onAccessChanged.emit(this, null);
    }

    public async login(username: string, password: string, keepLogin?: boolean, label?: string): Promise<Access> {
        const timestamp = Date.now();
        const hash = toHashInt(timestamp.toString());
        const privateKey = EC.createPrivateKey(password);
        const sign = ECDSA.sign(hash, privateKey).toString();

        const response: AccessData = await this.server.getJSON(API_LOGIN, {
            timestamp,
            username,
            sign,
            keepLogin,
            label
        });

        const access = new Access(
            response.api,
            response.secret,
            response.rights,
            response
        );

        this.updateAccess(access, keepLogin);

        this.onLogin.emit(this, access);

        return access;
    }

    public async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
        const oldPrivateKey = EC.createPrivateKey(oldPassword);
        const oldPublickey = EC.secp256k1.createPublicKey(oldPrivateKey).toString();

        const newPrivateKey = EC.createPrivateKey(newPassword);
        const newPublickey = EC.secp256k1.createPublicKey(newPrivateKey).toString();

        return await this.server.getPrivateBool(API_CHANGE_PASSWORD, {
            old: oldPublickey,
            new: newPublickey
        });
    }

    public async logout(): Promise<boolean> {
        if (!this._access)
            return true;

        await this.server.getPrivateBool(API_LOGOUT);

        this.resetAccess();

        this.onLogout.emit(this);

        return true;
    }

    public async testAccess(data: TestAccessData = this.access): Promise<Access | null> {
        if (!data || !data.api || !data.secret)
            throw new Error("missing api or secret key");

        const timestamp = Date.now();
        const result: {
            readonly rights: number;
            readonly label: string;
        } = await this.server.getJSON(API_HAS_ACCESS, {
            api: data.api,
            signature: Access.sign(timestamp.toString(), data.secret),
            timestamp
        });

        if (!result)
            return null;

        return new Access(
            data.api,
            data.secret,
            result.rights,
            result
        );
    }

    public getAccesses(): Promise<readonly Access[]> {
        return this.server.getPrivateJSON(API_GET_ACCESSES)
            .then((data: AccessData[]) => data.map(data => new Access(data.api, data.secret, data.rights, data)));
    }

    public createAccess(options: CreateAccessOptions = {}): Promise<Access> {
        return this.server.getPrivateJSON(API_CREATE_ACCESS, options)
            .then((data: AccessData) => new Access(data.api, data.secret, data.rights, data));
    }

    public deleteAccess(access: Access): Promise<boolean> {
        return this.server.getPrivateBool(API_DELETE_ACCESS, { access_to_delete: access.api });
    }

    public deleteAllAccesses(): Promise<boolean> {
        return this.server.getPrivateBool(API_DELETE_ACCESS, {});
    }

    private async deserializeAccess(): Promise<Access | null> {
        const serializedAccess = window.sessionStorage.getItem(this.accessKey)
            || window.localStorage.getItem(this.accessKey);

        if (!serializedAccess)
            return null;

        const access = Access.fromHex(serializedAccess);

        if (!access)
            return null;

        if (!await this.testAccess(access)) {
            window.localStorage.removeItem(this.accessKey);
            window.sessionStorage.removeItem(this.accessKey);
            return null;
        }

        return access;
    }

    private serializeAccess(access: Access, keepLogin = false) {
        if (keepLogin) {
            window.localStorage.setItem(this.accessKey, access.toHex());
            window.sessionStorage.removeItem(this.accessKey);
        } else {
            window.sessionStorage.setItem(this.accessKey, access.toHex());
            window.localStorage.removeItem(this.accessKey);
        }
    }

    private async parameterizedAccess(): Promise<Access | null> {
        const api = Router.route.get(this.apiKey);
        const secret = Router.route.get(this.secretKey);

        if (!api || !secret)
            return null;

        const access = await this.testAccess({ api, secret });

        this.serializeAccess(access);

        return access;
    }
}