import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { DoubanBookParser } from '../../lib/parser/douban.book.parser';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Run Bookworm GenerateInfo', async () => {
		//vscode.commands.executeCommand("bookworm.generateInfo");
		const parser = new DoubanBookParser();
		await parser.fetchBook("1223");
	});
});
