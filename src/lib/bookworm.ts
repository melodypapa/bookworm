import { Uri, window } from "vscode";
import { AmazonBookParser } from "./parser/amazon.book.parser";
import * as path from 'path';
import * as fs from 'fs';
import { Book } from "./model/book.type";
import { DoubanBookParser } from './parser/douban.book.parser';
import { BookWormError } from "./error/bookworm.error";

export class Bookworm {

	private isValidIsbn(isbn: string): boolean {
		if (isbn.match(/^\d(?:-?\d){9}(?:\d{3})?$/)) {
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
						if (path.extname(file) === ".bookinfo") {
							resolve(path.basename(file));
						}
					});
					resolve("");
				});
			}
			catch (err) {
				throw err;
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

	public async onGenerateBookInfo(uri: Uri) {
		let isbn = "";
		if (uri instanceof Uri) {
			isbn = await this.getIsbnFromUri(uri);
		}
		if (isbn === "") {
			window.showInformationMessage("Unknown book");
			return;
		}

		try {
			let bookPath = uri.fsPath;
			let book: Book | undefined;
			book = await this.fetchBookWithAmazon(isbn);
			if (book === undefined){
				book = await this.fetchBookWithDouban(isbn);
			}
			if (book === undefined){
				throw new BookWormError("Book can not be found.");
			}
			console.log(book);
			if (!this.urlIsPath(uri)) {
				bookPath = path.dirname(uri.fsPath);
			}
			this.createBookInfoFile(path.join(uri.fsPath, `${isbn}.bookinfo`), book);
			window.showInformationMessage(book.name + " is generated.");
		}
		catch (err) {
			window.showErrorMessage(err);
		}

	}
}