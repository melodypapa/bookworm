import { Uri, window } from "vscode";
import { AmazonBookParser } from "./parser/amazon.book.parser";
import * as path from 'path';
import * as fs from 'fs';
import { Book } from "./model/book.type";
import { DoubanBookParser } from './parser/douban.book.parser';
import { BookWormError } from "./error/bookworm.error";
import { glob } from "glob";

const bookInfoExtension = "book.json";

export class Bookworm {

	private isValidIsbn(isbn: string): boolean {
		if (isbn.match(/^\d(?:-?[\dx]){9}(?:[\dx]{3})?$/i)) {
			return true;
		}
		return false;
	}

	private async getIsbnFromPath(basePath: string): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				let isbn = path.parse(basePath).name;
				if (this.isValidIsbn(isbn)) {
					resolve(isbn);
				}
				fs.readdir(basePath, (err, files: string[]) => {
					if (err) {
						throw err;
					}
					files.forEach((file) => {
						if (path.extname(file) === `.${bookInfoExtension}`) {
							resolve(path.basename(file));
						}
					});
					resolve("");
				});
			}
			catch (err) {
				reject(err);
			}
		});
	}

	private urlIsPath(uri: Uri): boolean {
		const stats = fs.statSync(uri.fsPath);
		if (stats.isDirectory()) {
			return true;
		}
		return false;
	}

	private async getIsbnFromUri(uri: Uri): Promise<string> {
		let isbn = "";
		if (this.urlIsPath(uri)) {
			isbn = await this.getIsbnFromPath(uri.fsPath);
		}
		else {
			isbn = path.parse(uri.fsPath).name;
		}

		if (this.isValidIsbn(isbn)) {
			console.log(`ISBN: ${isbn}`);
			return isbn;
		}
		return "";
	}

	private loadBookInfoFile(filePath: string): Promise<Book> {
		return new Promise((resolve, reject) => {
			try {
				glob(path.join(filePath, "/*.book.json"), (err, matches) => {
					if (err) {
						throw err;
					}
					if (matches.length === 0) {
						throw new BookWormError(`Cannot find any book.json in the ${filePath}`);
					}
					fs.readFile(matches[0], 'utf8', (err, data) => {
						if (err) {
							throw err;
						}
						const book = JSON.parse(data);
						resolve(book);
					});
				});
			}
			catch (err) {
				reject(err);
			}
		});
	}

	private createBookInfoFile(filePath: string, book: Book) {
		let data = JSON.stringify(book);
		fs.writeFileSync(filePath, data);
	}

	private async fetchBookWithAmazon(asin: string): Promise<Book | undefined> {
		let book = undefined;
		try {
			const bookworm = new AmazonBookParser();
			book = await bookworm.fetchBook(asin);
		}
		catch (err) {
			console.log(err);
		}
		return book;
	}

	private async fetchBookWithDouban(isbn: string): Promise<Book | undefined> {
		let book = undefined;
		try {
			const bookworm = new DoubanBookParser();
			book = await bookworm.fetchBook(isbn);
		}
		catch (err) {
			console.log(err);
		}
		return book;
	}

	private async checkIsbn(uri: Uri): Promise<string> {
		let isbn = "";
		if (uri instanceof Uri) {
			isbn = await this.getIsbnFromUri(uri);
		}
		if (isbn === "") {
			window.showInformationMessage("Unknown book");
			throw new BookWormError("Invalid book Id");
		}
		return isbn;
	}

	private async generateBookInfoJson(uri: Uri, isbn: string, book: Book) {
		console.log(book);
		if (!this.urlIsPath(uri)) {
			let bookPath = path.dirname(uri.fsPath);
		}
		this.createBookInfoFile(path.join(uri.fsPath, `${isbn}.${bookInfoExtension}`), book);
		window.showInformationMessage(book.name + " is generated.");
	}

	public async onGenerateBookInfo(uri: Uri) {
		try {
			let isbn = await this.checkIsbn(uri);
			let bookPath = uri.fsPath;
			let book: Book | undefined;
			book = await this.fetchBookWithAmazon(isbn);
			if (book === undefined) {
				book = await this.fetchBookWithDouban(isbn);
			}
			if (book === undefined) {
				throw new BookWormError("Book can not be found.");
			}
			this.generateBookInfoJson(uri, isbn, book);
		}
		catch (err) {
			window.showErrorMessage(err);
		}
	}

	public async onGenerateBookInfoByAmazon(uri: Uri) {
		try {
			let isbn = await this.checkIsbn(uri);
			let bookPath = uri.fsPath;
			let book: Book | undefined;
			book = await this.fetchBookWithAmazon(isbn);
			if (book === undefined) {
				throw new BookWormError("Book can not be found.");
			}
			this.generateBookInfoJson(uri, isbn, book);
		}
		catch (err) {
			window.showErrorMessage(err);
		}
	}

	public async onGenerateBookInfoByDouban(uri: Uri) {
		try {
			let isbn = await this.checkIsbn(uri);
			let bookPath = uri.fsPath;
			let book: Book | undefined;
			book = await this.fetchBookWithDouban(isbn);
			if (book === undefined) {
				throw new BookWormError("Book can not be found.");
			}
			this.generateBookInfoJson(uri, isbn, book);
		}
		catch (err) {
			window.showErrorMessage(err);
		}
	}

	public async onFormatPath(uri: Uri) {
		try {
			const book = await this.loadBookInfoFile(uri.fsPath);
			let pathName = "";
			pathName = `${book.publisher}.${book.name}.${book.publishDate?.year}`;
			pathName = pathName.replace(/[:]/, "");
			pathName = pathName.replace(/\s+/g, ".");
			let result = await window.showInputBox({
				value: pathName,
				// valueSelection: [2, 4],
				// placeHolder: 'For example: fedcba. But not: 123',
				/*validateInput: text => {
					window.showInformationMessage(`Validating: ${text}`);
					return text === '123' ? 'Not 123!' : null;
				}*/
			});
			if (!result){
				throw new BookWormError("Invalid Path");
			}
			pathName = path.join(path.dirname(uri.fsPath), result);
			fs.renameSync(uri.fsPath, pathName);
			window.showInformationMessage(`${uri.fsPath} => ${pathName}`);
		}
		catch (err){
			window.showErrorMessage(err);
		}
	}
}