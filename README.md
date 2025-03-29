# Context Code

Project Context Code is a Visual Studio Code extension that lets you generate a comprehensive context of your project by selecting files and directories. It produces a Markdown document containing the contents of the selected files with proper syntax highlighting, making it easier to review or share your project's state.

## Features

- **Tree View Navigation:** Browse your project files through a dedicated tree view in the Activity Bar.
- **File & Folder Selection:** Easily select or deselect files and directories to include in your project context.
- **Context Generation:** Generate a Markdown document with each selected file’s content formatted in code blocks.
- **Ignore Patterns:** Customize ignore patterns (using glob syntax) to exclude unwanted files or directories (e.g., `.git`, `node_modules`).
- **Live Updates:** The tree view automatically refreshes when files change in your workspace.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/code-context.git
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Compile the extension:**

   ```bash
   npm run compile
   ```

4. **Open the project in Visual Studio Code and start debugging:**

   - Press `F5` to launch a new Extension Development Host.

## Usage

1. **Open your project:** Make sure you have a folder or workspace open in VS Code.

2. **Access the tree view:**  
   - Navigate to the **Project Context** view in the Activity Bar.
   - Use the **Select Files** tree to browse your project.

3. **Select files or folders:**  
   - Click on an item to toggle its selection.  
   - The checkbox state will update accordingly.

4. **Generate Context:**  
   - Run the `Generate Project Context` command from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) or via the tree view title button.
   - A new Markdown document will open with the project context generated from your selection.
   - If the document already exists, it will be updated with the new context.
   - After generation, the file selection will be cleared to allow for a fresh selection next time.

## Configuration

You can customize the extension settings through VS Code settings:

- **`projectContextBuilder.ignorePatterns`:**  
  An array of glob patterns or relative paths to ignore when generating the context.  
  **Default:** `[".git", "node_modules", ".vscode", "*.log", "dist", "build"]`

## Commands

- **Generate Project Context:**  
  Generates the Markdown context from the selected files. If a context document is already open, it updates its content.

- **Toggle Selection:**  
  Allows you to select or deselect items from the tree view.

- **Refresh View:**  
  Automatically refreshes the file tree when changes occur in the workspace.

## Development

- **Linting:**

  ```bash
  npm run lint
  ```

- **Watching for Changes:**

  ```bash
  npm run watch
  ```

- **Running Tests:**

  ```bash
  npm run test
  ```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests with improvements or bug fixes.
