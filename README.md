# Context Code

**Context Code** is a Visual Studio Code extension that helps you generate a clean, organized context of your project by combining the contents of selected files and folders into a single Markdown document — perfect for AI tools, documentation, or debugging.

![](https://imgur.com/4URaTzn.gif)

## Features

- **Tree View Navigation:** Explore your project through a custom tree view in the Activity Bar.
- **File & Folder Selection:** Select files and directories with checkbox toggles to include in your context.
- **Explorer Integration:** Right-click any file or folder in the native VS Code explorer and generate context directly — no need to use the tree view.
- **Context Generation:** Automatically creates a Markdown document, with file names and content wrapped in language-specific code blocks.
- **Ignore Patterns:** Configure glob-based ignore patterns (e.g., `.git`, `node_modules`, `dist`) to skip irrelevant files.
- **Live File Sync:** The file tree view updates in real time as your workspace changes.

## Usage

1. **Open a project folder** in VS Code.

2. **Select files and folders:**
   - Via the **Context Code** view in the Activity Bar.
   - Or, directly from the **Explorer** via right-click → `Generate Context`.

3. **Generate context:**
   - Click `Generate Context` from the tree view, or use the context menu command.
   - A Markdown file will open with the full content of the selected files.
   - If the file is already open, it will be updated in-place.

## Contributing

Contributions are welcome!  
If you have ideas, find bugs, or want to help improve the extension, feel free to open an issue or submit a pull request on [GitHub](https://github.com/andygeek/context-code).
