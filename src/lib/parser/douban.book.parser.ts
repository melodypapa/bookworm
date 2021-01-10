import fetch, { Response } from 'node-fetch';
import { Book } from '../model/book.type';
import { BookParser } from './book.parser';
import * as cheerio from 'cheerio';

export class DoubanBookParser extends BookParser {

    public fetchBook(isbn: string): Promise<Book> {
        return new Promise(async (resolve, reject) => {
            try {
                isbn = "14919157651";
                const uri: string = `https://search.douban.com/book/subject_search?search_text=${isbn}&cat=1001`;
                const resp: Response = await fetch(uri);
                const body: string = await resp.text();
                console.log(body);
                const $ = cheerio.load(body);
                const title = $("div.title");
                console.log(title);
                const book: Book = {
                    name: "",
                    uri: uri,
                };

                /*const details = {};
                for (let idx = 0; idx < detailKeyTags.length; idx++) {
                    const key = $(detailKeyTags[idx]).text().replace(/[\s:]+/, "").toLowerCase();
                    const value = $(detailValueTags[idx]).text();
                    switch (key) {
                        case "publisher":
                            const match = value.match(/([\w\s']+);?([\w\s]+)?\s?\((\w+)\s+(\d{1,2}),\s+(\d{4})\)/);
                            if (match) {
                                book.publisher = this.stripBlank(match[1]);
                                book.edition = this.stripBlank(match[2]);
                                book.publishDate = {
                                    year: parseInt(match[5]),
                                    month: this.convertMonth(match[3]),
                                    day: parseInt(match[4]),
                                };
                            }
                            else {
                                book.publisher = this.stripBlank(value);
                            }
                            break;
                        case "language":
                            book.language = value;
                            break;
                        case "isbn-10":
                            book.isbn10 = value;
                            break;
                        case "isbn-13":
                            book.isbn13 = value;
                            break;
                        case "paperback":
                            book.paperback = value;
                            break;
                    }
                }*/
                resolve(book);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
}