import * as vscode from 'vscode';
import { ProjectFilesProvider } from '../projectFilesProvider';
import { registerRefreshCommand } from './refreshCommand';
import { registerGenerateCommand } from './generateCommand';
import { registerCollapseCommand } from './collapseCommand';

export function registerAllCommands(
  context: vscode.ExtensionContext,
  projectFilesProvider: ProjectFilesProvider,
  rootPath: string
) {
  registerRefreshCommand(context, projectFilesProvider);
  registerGenerateCommand(context, projectFilesProvider, rootPath);
  registerCollapseCommand(context);
}
