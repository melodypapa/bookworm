import fetch, { Response } from "node-fetch";
import * as cheerio from "cheerio";
import { spawn } from "child_process";

export type Book = {
    name: string;
    uri: string;
    publisher?: string;
    publishDate? : {year: number, month: number, day?: number};
    isbn10?: string;
    isbn13?: string;
    language?: string;
    paperback?: string;
};


export class AmazonBookworm {
    private bookUri: string;

    /** The name list for each month  */
    private months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

    constructor(private isbn: string) {
        this.bookUri = `https://www.amazon.com/dp/${this.isbn}`;
    }

    private convertMonth(month: string): number {
        for (let idx = 0; idx < this.months.length; idx ++){
            if (this.months[idx] === month){
                return idx + 1;
            }
        }
        return 0;
    }

    public fetchBook(): Promise<Book> {
        return new Promise(async (resolve, reject) => {
            try {
                const resp: Response = await fetch(this.bookUri);
                const body: string = await resp.text();
                const $ = cheerio.load(body);
                const detailKeyTags = $("span.a-list-item>span:even", ".detail-bullet-list");
                const detailValueTags = $("span.a-list-item>span:odd", ".detail-bullet-list");
                const book: Book = {
                    name: $('#productTitle').text(),
                    uri: this.bookUri
                };
                
                const details = {};
                for (let idx = 0; idx < detailKeyTags.length; idx ++){
                    const key = $(detailKeyTags[idx]).text().replace(/[\s:]+/ , "").toLowerCase();
                    const value = $(detailValueTags[idx]).text();
                    switch (key){
                        case "publisher":
                            const match =  value.match(/([\w\s]+)\s?\((\w+)\s+(\d{1,2}),\s+(\d{4})\)/);
                            if (match){
                                book.publisher = match[1];
                                book.publishDate = {
                                    year: parseInt(match[4]), 
                                    month: this.convertMonth(match[2]), 
                                    day: parseInt(match[3]),
                                };
                            }
                            else {
                                book.publisher = value;
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
                            book.publisher = value;
                            break;
                    }
                }
                resolve(book);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}

