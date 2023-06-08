import { Localization, parseToNumeric } from "corejs";
import { View } from "../core";

export enum LabelType {
    Default = 'default',
    Balance = 'balance'
}

export class Label extends View {
    protected readonly label = document.createElement('span');

    private _type = LabelType.Default;

    constructor(...classes: readonly string[]) {
        super(...classes, 'label-view');

        this.label.innerText = '_label_';

        this.div.appendChild(this.label);
    }

    public get text(): string { return this.label.innerText; }
    public set text(value: string) {
        this.label.innerText = Localization.translate(value);

        switch (this._type) {
            case LabelType.Balance:
                this.isNegative = 0 > this.numberValue;
                break;
        }
    }

    public get type(): LabelType { return this._type; }
    public set type(value: LabelType) {
        this._type = value;

        switch (value) {
            case LabelType.Balance:
                this.isNegative = 0 > this.numberValue;
                break;

            default:
                this.isNegative = false;
                break;
        }
    }

    public get numberValue(): number { return Number(parseToNumeric(this.text)); }
}