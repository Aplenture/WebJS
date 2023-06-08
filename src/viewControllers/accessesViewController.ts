import { formatDateTime } from "corejs";
import { Access, NotificationController, PopupController, Session, View } from "../core";
import { ButtonType, TableSelectionMode } from "../enums";
import { TableViewControllerDataSource } from "../interfaces";
import { Button, Label } from "../views";
import { AccessViewController } from "./accessViewController";
import { BodyViewController } from "./bodyViewController";
import { TableViewController } from "./tableViewController";

export class AccessesViewController extends BodyViewController implements TableViewControllerDataSource {
    public readonly tableViewController = new TableViewController();

    public readonly createButton = new Button('create-button');
    public readonly deleteButton = new Button('delte-button');

    public defaultAPIRights = ~(1 << 0);

    protected accesses: readonly Access[] = [];

    constructor(
        public readonly session: Session,
        public readonly detailViewController: AccessViewController,
        ...classes: string[]
    ) {
        super(...classes, 'accesses-view-controller');

        this.title = '#_apis';
        this.titleBar.isHidden = true;

        this.tableViewController.titleLabel.text = '#_apis';
        this.tableViewController.dataSource = this;
        this.tableViewController.selectionMode = TableSelectionMode.Clickable;
        this.tableViewController.onSelectedCell.on(cell => {
            this.detailViewController.access = this.accesses[cell.index];

            PopupController.pushViewController(this.detailViewController);
        });

        this.detailViewController.onAccessUpdated.on(() => this.load());
        this.detailViewController.onAccessDeleted.on(() => this.load());

        this.createButton.text = '#_api_create';
        this.createButton.onClick.on(() => this.create());

        this.deleteButton.type = ButtonType.Delete;
        this.deleteButton.text = '#_api_delete_all';
        this.deleteButton.onClick.on(() => this.delteAll());

        this.appendChild(this.tableViewController);

        this.footerBar.appendChild(this.deleteButton);
        this.footerBar.appendChild(this.createButton);
    }

    public async load(): Promise<void> {
        this.accesses = await this.session.getAccesses();

        await super.load();
    }

    public numberOfCells(sender: TableViewController, category: number): number {
        return this.accesses.length;
    }

    public createHeader(sender: TableViewController): View {
        return new Cell();
    }

    public createCell(sender: TableViewController, category: number): View {
        return new Cell();
    }

    public updateCell(sender: TableViewController, cell: Cell, row: number, category: number): void {
        const access = this.accesses[row];

        cell.labelLabel.text = this.session.access.api == access.api
            ? '#_session_current'
            : access.label;

        cell.typeLabel.text = (access.rights & (1 << 0))
            ? '#_login'
            : '#_api';

        cell.expirationLabel.text = access.expiration
            ? formatDateTime(new Date(access.expiration))
            : '';
    }

    public async create(rights = this.defaultAPIRights): Promise<Access> {
        const label = await PopupController.queryString('#_api_create_text', '#_api_create');

        if (!label)
            return null;

        const result = await this.session.createAccess({ label, rights });

        this.load();

        this.detailViewController.access = result;

        PopupController.pushViewController(this.detailViewController);

        // expose after loading
        this.detailViewController.secretLabel.isExposed = true;

        return result;
    }

    public async delteAll(): Promise<void> {
        if (!await PopupController.queryBoolean('#_api_delete_all_query', '#_api_delete_all_title'))
            return;

        await this.session.deleteAllAccesses();

        this.load();

        NotificationController.pushNotification({ text: '#_api_delete_all_text', title: '#_api_delete_all_title' });
    }
}

class Cell extends View {
    public readonly labelLabel = new Label('label-label');
    public readonly typeLabel = new Label('type-label');
    public readonly expirationLabel = new Label('expiration-label');

    constructor(...classes: string[]) {
        super(...classes);

        this.labelLabel.text = '#_label';
        this.typeLabel.text = '#_type';
        this.expirationLabel.text = '#_expiration_date';

        this.appendChild(this.labelLabel);
        this.appendChild(this.typeLabel);
        this.appendChild(this.expirationLabel);
    }
}