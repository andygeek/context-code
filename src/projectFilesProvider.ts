import * as vscode from 'vscode';
import * as path from 'path';

export class ProjectFilesProvider
  implements vscode.TreeDataProvider<ProjectItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ProjectItem | undefined | null | void
  > = new vscode.EventEmitter<ProjectItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    ProjectItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private selectedItems: Set<string> = new Set();

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private getRawCheckboxState(
    state:
      | vscode.TreeItemCheckboxState
      | {
          state: vscode.TreeItemCheckboxState;
          tooltip?: string;
          accessibilityInformation?: vscode.AccessibilityInformation;
        }
      | undefined
  ): vscode.TreeItemCheckboxState | undefined {
    if (state && typeof state === 'object' && 'state' in state) {
      return state.state;
    }
    return state as vscode.TreeItemCheckboxState | undefined;
  }

  getTreeItem(element: ProjectItem): vscode.TreeItem {
    const fsPath = element.resourceUri.fsPath;
    const currentState = this.getRawCheckboxState(element.checkboxState);

    if (element.lastCheckboxState === undefined) {
      element.lastCheckboxState = currentState;
    } else {
      if (
        element.lastCheckboxState === vscode.TreeItemCheckboxState.Unchecked &&
        currentState === vscode.TreeItemCheckboxState.Unchecked
      ) {
        this.selectedItems.add(fsPath);
        element.checkboxState = vscode.TreeItemCheckboxState.Checked;
      } else if (
        element.lastCheckboxState === vscode.TreeItemCheckboxState.Checked &&
        currentState === vscode.TreeItemCheckboxState.Checked
      ) {
        this.selectedItems.delete(fsPath);
        element.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
      }
      element.lastCheckboxState = this.getRawCheckboxState(
        element.checkboxState
      );
    }
    return element;
  }

  async getChildren(element?: ProjectItem): Promise<ProjectItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No project folder open');
      return [];
    }

    const parentUri = element
      ? element.resourceUri
      : vscode.Uri.file(this.workspaceRoot);

    try {
      const children = await vscode.workspace.fs.readDirectory(parentUri);
      const items = children.map(([name, type]) => {
        const childUri = vscode.Uri.joinPath(parentUri, name);
        const isDirectory = type === vscode.FileType.Directory;
        const collapsibleState = isDirectory
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None;

        const item = new ProjectItem(name, collapsibleState, childUri);
        item.checkboxState = this.selectedItems.has(childUri.fsPath)
          ? vscode.TreeItemCheckboxState.Checked
          : vscode.TreeItemCheckboxState.Unchecked;

        return item;
      });

      items.sort((a, b) => {
        if (a.collapsibleState !== b.collapsibleState) {
          return a.collapsibleState === vscode.TreeItemCollapsibleState.None
            ? 1
            : -1;
        }
        return a.label!.localeCompare(b.label!);
      });
      return items;
    } catch (error) {
      console.error(`Error reading directory ${parentUri.fsPath}: ${error}`);
      if (!element) {
        vscode.window.showErrorMessage(
          `Failed to read workspace directory: ${error}`
        );
      }
      return [];
    }
  }

  getSelectedItems(): Set<string> {
    return this.selectedItems;
  }

  clearSelections(): void {
    this.selectedItems.clear();
    this.refresh();
  }
}

export class ProjectItem extends vscode.TreeItem {
  public lastCheckboxState?: vscode.TreeItemCheckboxState;

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly resourceUri: vscode.Uri
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.resourceUri.fsPath}`;
    this.description = path.basename(this.resourceUri.fsPath);
    this.checkboxState = vscode.TreeItemCheckboxState.Unchecked;

    if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
      this.iconPath = new vscode.ThemeIcon('symbol-file');
    } else {
      this.iconPath = new vscode.ThemeIcon('folder');
    }
  }
}
