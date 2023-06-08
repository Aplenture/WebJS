import { PopupController, Session } from "../core";
import { BodyViewController } from "./bodyViewController";

export class LogoutViewController extends BodyViewController {
    constructor(
        public readonly session: Session,
        ...classes: string[]
    ) {
        super(...classes, 'logout-view-controller');

        this.title = '#_logout';
    }

    public focus() {
        PopupController.queryBoolean('#_do_you_want_to_logout', '#_logout')
            .then(result => result && this.session.logout());
    }
}