import { TableSelectionMode } from "../enums";
import { View } from "../core";

export class GridView extends View {
    private _selectionMode = TableSelectionMode.None;

    private _columns = 0;
    private _rows = 0;

    constructor(...classes: string[]) {
        super(...classes, 'grid-view');
    }

    public get selectedCells(): readonly View[] {
        return this.findCells().filter(child => child.isSelected);
    }

    public get selectedCellIndices(): readonly number[] {
        const cells = this.findCells();

        return cells
            .map((_, index) => index)
            .filter(index => cells[index].isSelected);
    }

    public get selectionMode(): TableSelectionMode { return this._selectionMode; }
    public set selectionMode(value: TableSelectionMode) {
        this._selectionMode = value;
        this.findCells().forEach(cell => cell.isClickable = value != TableSelectionMode.None);
    }

    public appendCell(view: View) {
        if (!view.hasClass('cell'))
            view.addClass('cell');

        this.appendChild(view);
    }

    public findCells(): readonly View[] {
        return this.children.filter(child => child.hasClass('cell'));
    }
}