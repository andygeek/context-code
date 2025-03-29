import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';

interface GenerateContextOptions {
    workspaceRoot: string;
    selectedPaths: string[];
    ignorePatterns: string[];
}

function normalizeIgnorePatterns(basePath: string, patterns: string[]): string[] {
    const normalized = new Set<string>();
    const normBasePath = path.normalize(basePath);

    for (const p of patterns) {
        const pattern = p.trim();
        if (!pattern) continue;

        let relativePattern: string;

        if (path.isAbsolute(pattern)) {
            const normPatternPath = path.normalize(pattern);
            if (normPatternPath.startsWith(normBasePath)) {
                relativePattern = path.relative(normBasePath, normPatternPath);
            } else {
                console.warn(`Ignoring absolute pattern outside workspace: ${pattern}`);
                continue;
            }
        } else {
            relativePattern = path.normalize(pattern);
        }

        if (relativePattern === '.' || !relativePattern) {
            continue;
        }
        normalized.add(relativePattern.replace(/\\/g, '/'));
    }
    return Array.from(normalized);
}

function shouldIgnore(relativePath: string, normalizedIgnores: string[]): boolean {
    const normRelativePath = path.normalize(relativePath).replace(/\\/g, '/');
    if (normRelativePath === '') return false;

    for (const ignore of normalizedIgnores) {
        if (normRelativePath === ignore) return true;
        if (normRelativePath.startsWith(ignore + '/')) return true;
    }
    return false;
}

async function readFileContent(fileUri: vscode.Uri): Promise<string | null> {
    try {
        const rawContent = await vscode.workspace.fs.readFile(fileUri);
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(rawContent);
        } catch (utf8Error) {
            console.warn(`File ${fileUri.fsPath} is not valid UTF-8, trying latin1...`);
            try {
                return new TextDecoder('latin1').decode(rawContent);
            } catch (latin1Error) {
                console.error(`Failed to decode ${fileUri.fsPath} with UTF-8 and latin1. Skipping content.`);
                return `[Error reading file content - Unsupported Encoding]`;
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading file ${fileUri.fsPath}: ${error}`);
        return null;
    }
}

async function walkDirectory(
    dirUri: vscode.Uri,
    basePath: string,
    normalizedIgnores: string[],
    outputCollector: string[]
): Promise<void> {
    try {
        const entries = await vscode.workspace.fs.readDirectory(dirUri);
        for (const [name, type] of entries) {
            const currentUri = vscode.Uri.joinPath(dirUri, name);
            const relativePath = path.relative(basePath, currentUri.fsPath);

            if (shouldIgnore(relativePath, normalizedIgnores)) {
                continue;
            }

            if (type === vscode.FileType.File) {
                const content = await readFileContent(currentUri);
                if (content !== null) {
                    const relativePathStd = relativePath.replace(/\\/g, '/');
                    const ext = path.extname(currentUri.fsPath).toLowerCase().substring(1);
                    const lang = ext || 'text';
                    outputCollector.push(`${relativePathStd}\n\`\`\`${lang}\n${content}\n\`\`\`\n`);
                }
            } else if (type === vscode.FileType.Directory) {
                await walkDirectory(currentUri, basePath, normalizedIgnores, outputCollector);
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading directory ${dirUri.fsPath}: ${error}`);
    }
}

export async function generateContext(
    options: GenerateContextOptions,
    previousContextUri: vscode.Uri | undefined
): Promise<vscode.Uri | undefined> {
    const { workspaceRoot, selectedPaths, ignorePatterns: rawIgnores } = options;
    const normalizedIgnores = normalizeIgnorePatterns(workspaceRoot, rawIgnores);
    const outputCollector: string[] = [];
    let generatedUri: vscode.Uri | undefined = undefined;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Project Context...",
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: "Processing selections..." });

        let processedCount = 0;
        const totalSelected = selectedPaths.length;
        for (const itemPath of selectedPaths) {
            const itemUri = vscode.Uri.file(itemPath);
            const relativePath = path.relative(workspaceRoot, itemPath);
            if (shouldIgnore(relativePath, normalizedIgnores)) continue;
            progress.report({ increment: (processedCount / totalSelected) * 80, message: `Processing ${path.basename(itemPath)}...` });
            try {
                const stats = await vscode.workspace.fs.stat(itemUri);
                if (stats.type === vscode.FileType.File) {
                    const content = await readFileContent(itemUri);
                    if (content !== null) {
                        const relativePathStd = relativePath.replace(/\\/g, '/');
                        const ext = path.extname(itemUri.fsPath).toLowerCase().substring(1);
                        const lang = ext || 'text';
                        outputCollector.push(`${relativePathStd}\n\`\`\`${lang}\n${content}\n\`\`\`\n`);
                    }
                } else {
                    console.warn(`Skipping directory ${itemPath} to avoid duplication.`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error processing ${itemPath}: ${error}`);
            }
            processedCount++;
        }

        if (outputCollector.length === 0) {
            vscode.window.showWarningMessage("No files selected or found to include in the context.");
            generatedUri = undefined;
            return;
        }

        const finalOutput = outputCollector.join('\n');
        progress.report({ increment: 90, message: "Updating editor..." });

        let targetEditor: vscode.TextEditor | undefined = undefined;

        if (previousContextUri) {
            targetEditor = vscode.window.visibleTextEditors.find(
                editor => editor.document.uri.toString() === previousContextUri.toString()
            );
        }

        try {
            if (targetEditor) {
                await targetEditor.edit(editBuilder => {
                    const fullRange = new vscode.Range(
                        targetEditor!.document.positionAt(0),
                        targetEditor!.document.positionAt(targetEditor!.document.getText().length)
                    );
                    editBuilder.replace(fullRange, finalOutput);
                });
                await vscode.window.showTextDocument(targetEditor.document, {
                    viewColumn: targetEditor.viewColumn,
                    preview: false,
                    preserveFocus: true
                });
                generatedUri = targetEditor.document.uri;
                vscode.window.showInformationMessage('Project context updated.');
            } else {
                const doc = await vscode.workspace.openTextDocument({
                    content: finalOutput,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, { preview: false });
                generatedUri = doc.uri;
                vscode.window.showInformationMessage('Project context generated and opened.');
            }
            progress.report({ increment: 100, message: "Done!" });
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to display generated context: ${error}`);
            generatedUri = undefined;
        }
    });

    return generatedUri;
}
