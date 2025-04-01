import * as vscode from 'vscode';
import { ProjectFilesProvider } from '../projectFilesProvider';

export function registerRefreshCommand(
  context: vscode.ExtensionContext,
  projectFilesProvider: ProjectFilesProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('projectContextBuilder.refresh', () => {
      projectFilesProvider.refresh();
    })
  );
}
