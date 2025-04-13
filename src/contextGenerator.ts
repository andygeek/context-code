import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';

interface GenerateContextOptions {
  workspaceRoot: string;
  selectedPaths: string[];
  ignorePatterns: string[];
}

async function loadGitIgnore(projectRoot: string): Promise<string[]> {
  const gitIgnoreUri = vscode.Uri.joinPath(
    vscode.Uri.file(projectRoot),
    '.gitignore'
  );
  try {
    const fileData = await vscode.workspace.fs.readFile(gitIgnoreUri);
    const content = new TextDecoder('utf-8').decode(fileData);
    const lines = content.split(/\r?\n/);
    return lines
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  } catch (error) {
    console.log(
      'No .gitignore file found or an error occurred while reading it:',
      error
    );
    return [];
  }
}

function normalizeIgnorePatterns(
  basePath: string,
  patterns: string[]
): string[] {
  const normalized = new Set<string>();
  const normBasePath = path.normalize(basePath);

  for (const p of patterns) {
    const pattern = p.trim();
    if (!pattern) continue;

    let relativePattern: string;

    if (pattern.startsWith('/')) {
      relativePattern = path.normalize(pattern.slice(1));
    } else if (path.isAbsolute(pattern)) {
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
  const commonIgnores = ['.git/', 'node_modules/', '.vscode/'];
  commonIgnores.forEach((p) => {
    if (!normalized.has(p)) {
      let covered = false;
      for (const existing of normalized) {
        if (existing.startsWith(p)) {
          covered = true;
          break;
        }
      }
      if (!covered) {
        normalized.add(p);
      }
    }
  });
  console.log('Normalized ignore patterns:', Array.from(normalized));
  return Array.from(normalized);
}

function shouldIgnore(
  relativePath: string,
  normalizedIgnores: string[]
): boolean {
  const normRelativePath = path.normalize(relativePath).replace(/\\/g, '/');

  if (normRelativePath === '') return false;

  for (const ignore of normalizedIgnores) {
    if (
      normRelativePath === ignore ||
      (ignore.endsWith('/') && normRelativePath === ignore.slice(0, -1))
    ) {
      return true;
    }
    if (ignore.endsWith('/') && normRelativePath.startsWith(ignore)) {
      return true;
    }
    if (!ignore.endsWith('/') && normRelativePath.startsWith(ignore + '/')) {
      return true;
    }
  }
  return false;
}

function shouldIgnoreFileByExtension(filePath: string): boolean {
  const config = vscode.workspace.getConfiguration('projectContextBuilder');
  const userIgnoredExts = config.get<string[]>('ignoreFileExtensions', []);

  const defaultIgnoredExts = [
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.bmp',
    '.tiff',
    '.webp',
    '.bin',
    '.jar',
    '.lock',
    '.probe',
  ];

  // Combina ambas listas en un Set para evitar duplicados y para obtener mejor performance en la búsqueda
  const ignoredExts = new Set([...defaultIgnoredExts, ...userIgnoredExts]);

  // Asegura convertir la extensión del archivo a minúsculas para la comparación
  return ignoredExts.has(path.extname(filePath).toLowerCase());
}

async function readFileContent(fileUri: vscode.Uri): Promise<string | null> {
  try {
    const rawContent = await vscode.workspace.fs.readFile(fileUri);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(rawContent);
    } catch (utf8Error) {
      console.warn(
        `File ${fileUri.fsPath} is not valid UTF-8, trying latin1...`
      );
      try {
        return new TextDecoder('latin1').decode(rawContent);
      } catch (latin1Error) {
        console.error(
          `Failed to decode ${fileUri.fsPath} with UTF-8 and latin1. Skipping content.`
        );
        return `[Error reading file content - Unsupported Encoding]`;
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error reading file ${fileUri.fsPath}: ${error}`
    );
    return null;
  }
}

async function walkDirectory(
  dirUri: vscode.Uri,
  basePath: string,
  normalizedIgnores: string[],
  outputCollector: string[],
  processedFiles: Set<string>
): Promise<void> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    entries.sort((a, b) => {
      const aIsDir = a[1] === vscode.FileType.Directory;
      const bIsDir = b[1] === vscode.FileType.Directory;
      if (aIsDir !== bIsDir) {
        return aIsDir ? -1 : 1;
      }
      return a[0].localeCompare(b[0]);
    });

    for (const [name, type] of entries) {
      const currentUri = vscode.Uri.joinPath(dirUri, name);
      const relativePath = path.relative(basePath, currentUri.fsPath);
      const relativePathStd = relativePath.replace(/\\/g, '/');

      if (shouldIgnore(relativePathStd, normalizedIgnores)) {
        continue;
      }

      if (type === vscode.FileType.File) {
        if (shouldIgnoreFileByExtension(currentUri.fsPath)) {
          continue;
        }
        if (!processedFiles.has(relativePathStd)) {
          const content = await readFileContent(currentUri);
          if (content !== null) {
            const ext = path
              .extname(currentUri.fsPath)
              .toLowerCase()
              .substring(1);
            const lang = ext || 'text';
            outputCollector.push(
              `${relativePathStd}\n\`\`\`${lang}\n${content}\n\`\`\`\n`
            );
            processedFiles.add(relativePathStd);
          }
        }
      } else if (type === vscode.FileType.Directory) {
        await walkDirectory(
          currentUri,
          basePath,
          normalizedIgnores,
          outputCollector,
          processedFiles
        );
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirUri.fsPath}: ${error}`);
    if (
      error instanceof vscode.FileSystemError &&
      error.code === 'NoPermissions'
    ) {
      console.warn(`Permission denied for directory: ${dirUri.fsPath}`);
    } else {
      vscode.window.showErrorMessage(
        `Error reading directory ${dirUri.fsPath}: ${error}`
      );
    }
  }
}

export async function generateContext(
  options: GenerateContextOptions,
  previousContextUri: vscode.Uri | undefined
): Promise<vscode.Uri | undefined> {
  const { workspaceRoot, selectedPaths, ignorePatterns: rawIgnores } = options;

  const defaultIgnores = vscode.workspace
    .getConfiguration('projectContextBuilder')
    .get<string[]>('defaultIgnorePatterns', []);

  // Se cargan los patrones desde .gitignore si existe en el proyecto.
  const gitIgnorePatterns = await loadGitIgnore(workspaceRoot);
  if (gitIgnorePatterns.length > 0) {
    console.log('Patrones cargados desde .gitignore:', gitIgnorePatterns);
  }

  const combinedIgnores = [
    ...defaultIgnores,
    ...rawIgnores,
    ...gitIgnorePatterns,
  ];
  const normalizedIgnores = normalizeIgnorePatterns(
    workspaceRoot,
    combinedIgnores
  );

  const outputCollector: string[] = [];
  const processedFiles = new Set<string>();
  let generatedUri: vscode.Uri | undefined = undefined;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Generating Project Context...',
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0, message: 'Processing selections...' });

      let processedCount = 0;
      const totalSelected = selectedPaths.length;

      for (const itemPath of selectedPaths) {
        const itemUri = vscode.Uri.file(itemPath);
        const relativePath = path.relative(workspaceRoot, itemPath);
        const relativePathStd = relativePath.replace(/\\/g, '/');

        if (
          shouldIgnore(relativePathStd, normalizedIgnores) ||
          shouldIgnoreFileByExtension(itemPath)
        ) {
          processedCount++;
          progress.report({
            increment: (processedCount / totalSelected) * 80,
            message: `Ignoring ${path.basename(itemPath)}...`,
          });
          continue;
        }

        progress.report({
          increment: (processedCount / totalSelected) * 80,
          message: `Processing ${path.basename(itemPath)}...`,
        });

        try {
          const stats = await vscode.workspace.fs.stat(itemUri);

          if (stats.type === vscode.FileType.File) {
            if (shouldIgnoreFileByExtension(itemPath)) {
              processedCount++;
              progress.report({
                increment: (processedCount / totalSelected) * 80,
                message: `Ignoring ${path.basename(itemPath)}...`,
              });
              continue;
            }
            if (!processedFiles.has(relativePathStd)) {
              const content = await readFileContent(itemUri);
              if (content !== null) {
                const ext = path
                  .extname(itemUri.fsPath)
                  .toLowerCase()
                  .substring(1);
                const lang = ext || 'text';
                outputCollector.push(
                  `${relativePathStd}\n\`\`\`${lang}\n${content}\n\`\`\`\n`
                );
                processedFiles.add(relativePathStd);
              }
            }
          } else if (stats.type === vscode.FileType.Directory) {
            await walkDirectory(
              itemUri,
              workspaceRoot,
              normalizedIgnores,
              outputCollector,
              processedFiles
            );
          }
        } catch (error) {
          console.error(`Error processing ${itemPath}: ${error}`);
        }
        processedCount++;
      }

      progress.report({ increment: 85, message: 'Finalizing output...' });

      if (outputCollector.length === 0) {
        vscode.window.showWarningMessage(
          'No files selected or found (after ignores) to include in the context.'
        );
        generatedUri = undefined;
        progress.report({ increment: 100, message: 'No content generated.' });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return;
      }

      const finalOutput = outputCollector.join('\n');
      progress.report({ increment: 90, message: 'Updating editor...' });

      try {
        await vscode.env.clipboard.writeText(finalOutput);
        vscode.window.showInformationMessage(
          'Project context copied to clipboard.'
        );
        progress.report({ increment: 100, message: 'Done!' });
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error copying context to clipboard: ${error}`);
        vscode.window.showErrorMessage(
          `Failed to copy project context: ${error}`
        );
      }
    }
  );

  return generatedUri;
}

export declare function updateLastGeneratedUri(
  uri: vscode.Uri | undefined
): void;
