import * as vscode from 'vscode';
import { generateContext } from '../contextGenerator';

let lastGeneratedContextUri: vscode.Uri | undefined = undefined;

export function registerMenuGenerateContext(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.menuGenerateContext',
      async (uri: vscode.Uri | undefined, selectedUris?: vscode.Uri[]) => {
        let uris: vscode.Uri[] = [];

        if (selectedUris && selectedUris.length > 0) {
          uris = selectedUris;
        } else if (uri instanceof vscode.Uri) {
          uris = [uri];
        } else {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            uris = [activeEditor.document.uri];
          } else {
            vscode.window.showWarningMessage(
              'No file or folder selected, or the command was executed without context.'
            );
            return;
          }
        }

        if (uris.length === 0) {
          vscode.window.showWarningMessage(
            'Could not determine the target file or folder.'
          );
          return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          vscode.window.showWarningMessage(
            'Please open a folder or workspace.'
          );
          return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        const config = vscode.workspace.getConfiguration(
          'projectContextBuilder'
        );
        const ignorePatterns = config.get<string[]>('ignorePatterns', []);

        const selectedPaths = uris.map((u) => u.fsPath);

        const newUri = await generateContext(
          {
            workspaceRoot,
            selectedPaths,
            ignorePatterns,
          },
          lastGeneratedContextUri
        );

        lastGeneratedContextUri = newUri;
      }
    )
  );
}
