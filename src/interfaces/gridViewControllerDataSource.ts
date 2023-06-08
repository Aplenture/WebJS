import { View } from "../core";
import { GridViewController } from "../viewControllers/gridViewController";

export interface GridViewControllerDataSource {
    numberOfCells(sender: GridViewController): number;
    createCell(sender: GridViewController, index: number): View;
    updateCell(sender: GridViewController, cell: View, index: number): void;
}