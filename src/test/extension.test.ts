import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-workspacify-test-'));
	let testFolder: string;

	suiteSetup(async () => {
		// Create test folder structure
		testFolder = path.join(tmpDir, 'test-folder');
		fs.mkdirSync(testFolder);
		fs.mkdirSync(path.join(testFolder, 'subfolder1'));
		fs.mkdirSync(path.join(testFolder, 'subfolder1', 'nested'));
		fs.writeFileSync(path.join(testFolder, 'root.txt'), 'root content');
		fs.writeFileSync(path.join(testFolder, 'subfolder1', 'file1.txt'), 'file1 content');
		fs.writeFileSync(path.join(testFolder, 'subfolder1', 'nested', 'deep.txt'), 'deep content');

		// Activate extension
		await vscode.commands.executeCommand('claude-workspacify.flattenFolder', vscode.Uri.file(testFolder));
	});

	suiteTeardown(() => {
		// Clean up test directories
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	test('Creates flattened folder with correct prefix', () => {
		const flattenedPath = path.join(tmpDir, 'flattened_test-folder');
		assert.strictEqual(fs.existsSync(flattenedPath), true);
	});

	test('Flattens files with correct naming pattern', () => {
		const flattenedPath = path.join(tmpDir, 'flattened_test-folder');
		const files = fs.readdirSync(flattenedPath);

		assert.strictEqual(files.includes('test-folder^root.txt'), true);
		assert.strictEqual(files.includes('test-folder^subfolder1^file1.txt'), true);
		assert.strictEqual(files.includes('test-folder^subfolder1^nested^deep.txt'), true);
	});

	test('Preserves file contents', () => {
		const flattenedPath = path.join(tmpDir, 'flattened_test-folder');

		const rootContent = fs.readFileSync(path.join(flattenedPath, 'test-folder^root.txt'), 'utf8');
		const file1Content = fs.readFileSync(path.join(flattenedPath, 'test-folder^subfolder1^file1.txt'), 'utf8');
		const deepContent = fs.readFileSync(path.join(flattenedPath, 'test-folder^subfolder1^nested^deep.txt'), 'utf8');

		assert.strictEqual(rootContent, 'root content');
		assert.strictEqual(file1Content, 'file1 content');
		assert.strictEqual(deepContent, 'deep content');
	});

	test('Fails when target folder already exists', async () => {
		try {
			await vscode.commands.executeCommand('claude-workspacify.flattenFolder', vscode.Uri.file(testFolder));
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.ok(error);
		}
	});

	test('Fails when source is not a folder', async () => {
		const filePath = path.join(testFolder, 'root.txt');
		try {
			await vscode.commands.executeCommand('claude-workspacify.flattenFolder', vscode.Uri.file(filePath));
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.ok(error);
		}
	});
});
