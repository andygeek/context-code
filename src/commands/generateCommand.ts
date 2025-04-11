import * as vscode from 'vscode';
import { ProjectFilesProvider } from '../projectFilesProvider';
import { generateContext } from '../contextGenerator';

let lastGeneratedContextUri: vscode.Uri | undefined = undefined;

export function registerGenerateCommand(
  context: vscode.ExtensionContext,
  projectFilesProvider: ProjectFilesProvider,
  rootPath: string
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'projectContextBuilder.generate',
      async () => {
        if (!projectFilesProvider) {
          vscode.window.showErrorMessage('ProjectFilesProvider not initialized.');
          return;
        }

        const selectedItemsSet = projectFilesProvider.getSelectedItems();
        if (selectedItemsSet.size === 0) {
          vscode.window.showWarningMessage(
            "No files or folders selected. Check items in the 'Select Files' view."
          );
          return;
        }

        const config = vscode.workspace.getConfiguration('projectContextBuilder');
        const ignorePatterns = config.get<string[]>('ignorePatterns', []);
        const selectedPaths = Array.from(selectedItemsSet);

        await generateContext(
          {
            workspaceRoot: rootPath,
            selectedPaths: selectedPaths,
            ignorePatterns: ignorePatterns,
          },
          undefined
        );

        projectFilesProvider.clearSelections();
      }
    )
  );
}
