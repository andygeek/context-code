import * as vscode from 'vscode';

export function registerCollapseCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('projectContextBuilder.collapse', () => {
      vscode.commands.executeCommand(
        'workbench.actions.treeView.projectFilesView.collapseAll'
      );
    })
  );
}
