import assert = require("assert");
import { window } from "vscode";
import { DoubanBookParser } from "../../../lib/parser/douban.book.parser";

suite("Douban Book Parser", ()=> {
    window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Fetch the correct ISBN', async() => {
        let parser = new DoubanBookParser();
        let book = await parser.fetchBook("9781593271749");
	});
});