import { Event, Localization } from "corejs";
import { View } from "../core";

export class Switch extends View {
    public readonly onChange = new Event<Switch, boolean>('Switch.onChange');

    protected readonly label = document.createElement('span');
    protected readonly input = document.createElement('input');

    constructor(...classes: readonly string[]) {
        super(...classes, 'switch-view');

        const label = document.createElement('label');
        const span1 = document.createElement('span');
        const span2 = document.createElement('span');

        this.input.type = 'checkbox';
        this.input.addEventListener('change', () => this.onChange.emit(this, this.input.checked));

        label.appendChild(this.input);
        label.appendChild(span1);

        span1.appendChild(span2);

        this.div.appendChild(this.label);
        this.div.appendChild(label);

        this.label.innerText = '_switch_title_';
    }

    public get hasFocus(): boolean { return document.activeElement == this.input; }

    public get title(): string { return this.label.innerText; }
    public set title(value: string) { this.label.innerText = Localization.translate(value); }

    public get isEnabled(): boolean { return this.input.checked; }
    public set isEnabled(value: boolean) { this.input.checked = value; }

    public get value(): boolean { return this.input.checked; }
    public set value(value: boolean) { this.input.checked = value; }

    public focus() {
        this.input.focus();
    }
}