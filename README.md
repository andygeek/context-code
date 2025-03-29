# Context Code

Project Context Code is a Visual Studio Code extension that lets you generate a comprehensive context of your project by selecting files and directories. It produces a Markdown document containing the contents of the selected files.

![](https://imgur.com/e3Fl4zr.gif)

## Features

- **Tree View Navigation:** Browse your project files through a dedicated tree view in the Activity Bar.
- **File & Folder Selection:** Easily select or deselect files and directories to include in your project context.
- **Context Generation:** Generate a Markdown document with each selected file’s content formatted in code blocks.
- **Ignore Patterns:** Customize ignore patterns (using glob syntax) to exclude unwanted files or directories (e.g., `.git`, `node_modules`).
- **Live Updates:** The tree view automatically refreshes when files change in your workspace.

## Usage

1. **Open your project:** Make sure you have a folder or workspace open in VS Code.

2. **Access the tree view:**  
   - Navigate to the **Context Code** view in the Activity Bar.
   - Use the **Select Files** tree to browse your project.

3. **Select files or folders:**  
   - Click on an item to toggle its selection.  
   - The checkbox state will update accordingly.

4. **Generate Context:**  
   - Click on `Generate Project Context` in the tree view title button.
   - A new Markdown document will open with the project context generated from your selection.
   - If the document already exists, it will be updated with the new context.
   - After generation, the file selection will be cleared to allow for a fresh selection next time.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests with improvements or bug fixes.
