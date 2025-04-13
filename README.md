# Context Code

**Context Code** is a Visual Studio Code extension that helps you generate a clean, organized snapshot of your project's context. Now available exclusively via the native VS Code explorer context menu, it automatically combines and formats your project's file contents into a Markdown document optimized for AI tools, documentation, or debugging.

![](https://imgur.com/yINJOdf.gif)

## Features

- **Explorer Integration Only:** Generate project context directly from the native VS Code file explorer via right-click—eliminating the previous custom tree view method.
- **Context Generation:** The extension aggregates file contents (with file names and language-specific code blocks) and immediately copies the generated context to your clipboard.
- **Automated File Filtering:** Automatically ignores files and folders listed in your `.gitignore` along with other configurable ignore patterns, ensuring only relevant content is included.
- **Seamless Experience:** With a single right-click or keyboard shortcut, you can extract a comprehensive context of your project without extra steps or manual selections.
- **Default Shortcut:** When multiple files are selected in the file explorer, the default shortcut `Shift + Command + 9` can be used to quickly generate context.

## Usage

1. **Open your project folder** in VS Code.

2. **Generate context:**
   - In the native **Explorer**, right-click on the file or folder from which you want to generate the context and select **Generate Context** from the context menu.
   - Alternatively, when multiple files are selected in the explorer, simply press the default shortcut `Shift + Command + 9`.

3. **Paste your context:**
   - The extension scans your project—excluding ignored files—and copies the formatted Markdown directly to your clipboard.
   - Simply paste the context into your AI tool, documentation, or debugging environment.

## Contributing

Contributions are welcome!  
If you have ideas, find bugs, or want to help improve the extension, please open an issue or submit a pull request on [GitHub](https://github.com/andygeek/context-code).
