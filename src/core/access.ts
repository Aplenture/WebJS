import { createSign, toHex } from "corejs";

interface Options {
    readonly expiration?: number;
    readonly label?: string;
}

export class Access {
    public readonly expiration: number;
    public readonly label: string;

    constructor(
        public readonly api: string,
        public readonly secret: string,
        public readonly rights: number,
        options: Options = {}
    ) {
        this.expiration = options.expiration || null;
        this.label = options.label || '';
    }

    public static fromHex(value: string): Access {
        const apiLength = parseInt(value.slice(0, 2), 16);
        const secretLength = parseInt(value.slice(apiLength + 2, apiLength + 4), 16);
        const rightsLength = parseInt(value.slice(apiLength + secretLength + 4, apiLength + secretLength + 6), 16);
        const expirationLength = parseInt(value.slice(apiLength + secretLength + rightsLength + 6, apiLength + secretLength + rightsLength + 8), 16);

        const api = value.slice(2, apiLength + 2);
        const secret = value.slice(apiLength + 4, apiLength + secretLength + 4);
        const rights = Number(value.slice(apiLength + secretLength + 6, apiLength + secretLength + rightsLength + 6));
        const expiration = Number(value.slice(apiLength + secretLength + rightsLength + 8, apiLength + secretLength + rightsLength + expirationLength + 8));
        const label = value.slice(apiLength + secretLength + rightsLength + expirationLength + 8);

        return new Access(api, secret, rights, {
            expiration,
            label
        });
    }

    public static sign(message: string, secret: string): string {
        return createSign(message, secret);
    }

    public toString(): string {
        return this.toHex();
    }

    public toHex(): string {
        const rights = this.rights ? this.rights.toString() : '';
        const expiration = this.expiration ? this.expiration.toString() : '';

        return `${toHex(this.api.length, 2)}${this.api}${toHex(this.secret.length, 2)}${this.secret}${toHex(rights.length, 2)}${rights}${toHex(expiration.length, 2)}${expiration}${this.label}`;
    }

    public sign(message: string): string {
        return Access.sign(message, this.secret);
    }

    public hasRights(rights: number): boolean {
        return 0 != (this.rights & rights);
    }
}