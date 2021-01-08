import { Book } from "../model/book.type";

export abstract class BookParser {
    public abstract fetchBook(asin: string): Promise<Book>;
}