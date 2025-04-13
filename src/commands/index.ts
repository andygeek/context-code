import * as vscode from 'vscode';
import { registerMenuGenerateContext } from './menuGenerateContext';

export function registerAllCommands(context: vscode.ExtensionContext) {
  registerMenuGenerateContext(context);
}
