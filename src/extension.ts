// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "claude-workspacify" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('claude-workspacify.flattenFolder', async (uri: vscode.Uri) => {
		if (!uri) {
			vscode.window.showErrorMessage('Please right-click on a folder to flatten');
			return;
		}

		const stats = await vscode.workspace.fs.stat(uri);
		if (stats.type !== vscode.FileType.Directory) {
			vscode.window.showErrorMessage('Please select a folder to flatten');
			return;
		}

		const sourceFolder = uri.fsPath;
		const baseName = path.basename(sourceFolder);
		const parentDir = path.dirname(sourceFolder);
		const targetFolder = path.join(parentDir, `flattened_${baseName}`);

		try {
			await createFlattenedFolder(sourceFolder, targetFolder, baseName);
			vscode.window.showInformationMessage(`Folder flattened successfully to: ${targetFolder}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Error flattening folder: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	context.subscriptions.push(disposable);
}

async function createFlattenedFolder(sourceFolder: string, targetFolder: string, rootFolderName: string) {
	if (fs.existsSync(targetFolder)) {
		throw new Error('Target folder already exists');
	}

	await fs.promises.mkdir(targetFolder);
	await flattenFolderStructure(sourceFolder, targetFolder, rootFolderName, [rootFolderName]);
}

async function flattenFolderStructure(
	currentPath: string,
	targetFolder: string,
	rootFolderName: string,
	pathParts: string[]
) {
	const items = await fs.promises.readdir(currentPath, { withFileTypes: true });

	for (const item of items) {
		const sourcePath = path.join(currentPath, item.name);

		if (item.isDirectory()) {
			const newPathParts = [...pathParts, item.name];
			await flattenFolderStructure(sourcePath, targetFolder, rootFolderName, newPathParts);
		} else {
			const flattenedName = pathParts.join('^') + '^' + item.name;
			const targetPath = path.join(targetFolder, flattenedName);
			await fs.promises.copyFile(sourcePath, targetPath);
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
