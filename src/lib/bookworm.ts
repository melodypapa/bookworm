import { pathToFileURL } from "url";
import { Uri, window } from "vscode";
import { AmazonBookworm, Book } from "./amazon";
import * as path from 'path';

export class Bookworm {

	private isValidIsbn(isbn: string): boolean {
		if (isbn.match(/\d(?:-?\d){9}(?:\d{3})?/)){
			return true;
		}
		return false;
	}

	private getIsbnFromUri(uri: Uri): string {
		const isbn = path.basename(uri.path);
		if (this.isValidIsbn(isbn)){
			return isbn;
		}
		return "";
	}

    public async onGenerateBookInfo(uri: Uri){
		let isbn: string;
		if (uri instanceof Uri){
			isbn = this.getIsbnFromUri(uri);
		}
		else {
			
		}
        const bookworm = new AmazonBookworm("1838987576");
		const book: Book = await bookworm.fetchBook();
		console.log(book);
		// Display a message box to the user
		window.showInformationMessage(book.name);
    }
}