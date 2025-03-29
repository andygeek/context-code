import * as vscode from 'vscode';
import { ProjectFilesProvider, ProjectItem } from './projectFilesProvider';
import { generateContext } from './contextGenerator';

let projectFilesProvider: ProjectFilesProvider | undefined;
let lastGeneratedContextUri: vscode.Uri | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage("Please open a folder or workspace.");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    projectFilesProvider = new ProjectFilesProvider(rootPath);
    vscode.window.registerTreeDataProvider('projectFilesView', projectFilesProvider);

    
    context.subscriptions.push(
      vscode.commands.registerCommand('projectContextBuilder.refresh', () =>
        projectFilesProvider?.refresh()
      )
    );

    context.subscriptions.push(
       vscode.commands.registerCommand('projectContextBuilder.generate', async () => {
           if (!projectFilesProvider) {
               vscode.window.showErrorMessage("ProjectFilesProvider not initialized.");
               return;
           }

           const selectedItemsSet = projectFilesProvider.getSelectedItems();
           if (selectedItemsSet.size === 0) {
               vscode.window.showWarningMessage("No files or folders selected. Check items in the 'Select Files' view.");
               return;
           }

           const config = vscode.workspace.getConfiguration('projectContextBuilder');
           const ignorePatterns = config.get<string[]>('ignorePatterns', []);
           const selectedPaths = Array.from(selectedItemsSet);

           const newUri = await generateContext(
               {
                   workspaceRoot: rootPath,
                   selectedPaths: selectedPaths,
                   ignorePatterns: ignorePatterns,
               },
               lastGeneratedContextUri
           );

           lastGeneratedContextUri = newUri;
           projectFilesProvider.clearSelections();
       })
     );

    console.log('Project Context Builder activated.');

    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange(() => projectFilesProvider?.refresh());
    watcher.onDidCreate(() => projectFilesProvider?.refresh());
    watcher.onDidDelete(() => projectFilesProvider?.refresh());
    context.subscriptions.push(watcher);
}

export function deactivate() {
     projectFilesProvider = undefined;
     lastGeneratedContextUri = undefined;
     console.log('Project Context Builder deactivated.');
}
