// src/extension.ts
import * as vscode from 'vscode';
import { ProjectFilesProvider } from './projectFilesProvider';
import { registerAllCommands } from './commands';

let projectFilesProvider: ProjectFilesProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage('Please open a folder or workspace.');
    return;
  }
  const rootPath = workspaceFolders[0].uri.fsPath;

  projectFilesProvider = new ProjectFilesProvider(rootPath);
  vscode.window.registerTreeDataProvider(
    'projectFilesView',
    projectFilesProvider
  );

  registerAllCommands(context, projectFilesProvider, rootPath);

  console.log('Project Context Builder activated.');

  const watcher = vscode.workspace.createFileSystemWatcher('**/*');
  watcher.onDidChange(() => projectFilesProvider?.refresh());
  watcher.onDidCreate(() => projectFilesProvider?.refresh());
  watcher.onDidDelete(() => projectFilesProvider?.refresh());
  context.subscriptions.push(watcher);
}

export function deactivate() {
  console.log('Project Context Builder deactivated.');
}
