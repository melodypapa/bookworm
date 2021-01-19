import { Uri, window } from "vscode";
import { AmazonBookParser} from "./parser/amazon.book.parser";
import * as path from 'path';
import * as fs from 'fs';
import { Book } from "./model/book.type";

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
					if (err){
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
			catch (err){
				throw err;
			}
		});
	}

	private urlIsPath(uri: Uri): boolean {
		const stats = fs.statSync(uri.fsPath);
		if (stats.isDirectory()){
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

	private createBookInfoFile(filePath: string, book: Book){
		let data = JSON.stringify(book);
		fs.writeFileSync(filePath, data);
	}

	public async onGenerateBookInfo(uri: Uri) {
		let isbn = "";
		if (uri instanceof Uri) {
			isbn = await this.getIsbnFromUri(uri);
		}
		if (isbn === ""){
			window.showInformationMessage("Unknown book");
			return;
		}

		try {
			let bookPath = uri.fsPath;
			const bookworm = new AmazonBookParser();
			const book: Book = await bookworm.fetchBook(isbn);
			console.log(book);
			if (!this.urlIsPath(uri)){
				bookPath = path.dirname(uri.fsPath);
			}
			this.createBookInfoFile(path.join(uri.fsPath, `${isbn}.bookinfo`), book);
			window.showInformationMessage(book.name + " is generated.");
		}
		catch (err){
			window.showErrorMessage(err);
		}
		
	}
}