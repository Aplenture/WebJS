import { PopupController, Router, Session } from "../core";
import { ButtonType } from "../enums";
import { Button, TextField } from "../views";
import { BodyViewController } from "./bodyViewController";

export class CurrentAccessViewController extends BodyViewController {
    public readonly saveButton = new Button('save');
    public readonly clearButton = new Button('clear');

    public readonly apiTextfield = new TextField('api');
    public readonly secretTextfield = new TextField('secret');

    constructor(
        public readonly session: Session,
        ...classes: string[]
    ) {
        super(...classes, 'current-access-view-controller');

        this.title = '#_access';
        this.titleBar.title = '#_access';

        this.apiTextfield.title = '#_api_key';
        this.apiTextfield.placeholder = '#_api_key';
        this.apiTextfield.onEnterKey.on(() => this.save());
        this.apiTextfield.onChange.on(() => this.clearButton.isDisabled = !this.apiTextfield.value && !this.secretTextfield.value);
        this.apiTextfield.onChange.on(() => this.saveButton.isDisabled = !this.apiTextfield.value || !this.secretTextfield.value);

        this.secretTextfield.title = '#_secret_key';
        this.secretTextfield.placeholder = '#_secret_key';
        this.secretTextfield.onEnterKey.on(() => this.save());
        this.secretTextfield.onChange.on(() => this.clearButton.isDisabled = !this.apiTextfield.value && !this.secretTextfield.value);
        this.secretTextfield.onChange.on(() => this.saveButton.isDisabled = !this.apiTextfield.value || !this.secretTextfield.value);

        this.saveButton.text = '#_save';
        this.saveButton.onClick.on(() => this.save());

        this.clearButton.type = ButtonType.Delete;
        this.clearButton.text = '#_clear';
        this.clearButton.onClick.on(() => this.clear());

        this.session.onAccessChanged.on(() => this.load());

        this.contentView.appendChild(this.apiTextfield);
        this.contentView.appendChild(this.secretTextfield);

        this.footerBar.appendChild(this.clearButton);
        this.footerBar.appendChild(this.saveButton);
    }

    public focus() {
        this.apiTextfield.focus();
    }

    public async load(): Promise<void> {
        if (this.session.access) {
            this.apiTextfield.value = this.session.access.api;
            this.secretTextfield.value = '***';
        } else {
            this.apiTextfield.value = Router.route.get('api') || '';
            this.secretTextfield.value = Router.route.get('secret') || '';
        }

        this.clearButton.isDisabled = !this.apiTextfield.value && !this.secretTextfield.value;
        this.saveButton.isDisabled = !this.apiTextfield.value || !this.secretTextfield.value;

        await super.load();

        if (!this.session.access && this.apiTextfield.value && this.secretTextfield.value)
            this.save();
    }

    public async clear(): Promise<boolean> {
        if (this.session.access) {
            if (!await PopupController.queryBoolean('#_reset_access_query', '#_reset_access_title'))
                return false;

            this.session.resetAccess();
        }

        this.load();

        return true;
    }

    private async save() {
        if (!this.apiTextfield.value)
            return await PopupController
                .pushMessage('#_api_key_not_set', '#_access')
                .then(() => this.apiTextfield.focus());

        if (!this.secretTextfield.value)
            return await PopupController
                .pushMessage('#_secret_key_not_set', '#_access')
                .then(() => this.secretTextfield.focus());

        const api = this.apiTextfield.value;
        const secret = this.secretTextfield.value;

        return this.session.testAccess({ api, secret }).then(access => {
            if (!access)
                return PopupController
                    .pushMessage('#_api_key_invalid', '#_access')
                    .then(() => this.load())
                    .then(() => this.focus());

            this.session.updateAccess(access, true);
            this.load();
            this.removeFromParent();
        }).catch(error => PopupController.pushError(error).then(() => this.load()).then(() => this.focus()));
    }
}