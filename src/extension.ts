import * as vscode from 'vscode';
import { registerAllCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage('Please open a folder or workspace.');
    return;
  }

  registerAllCommands(context);

  console.log('Context Code activated.');
}

export function deactivate() {
  console.log('Context Code deactivated.');
}
