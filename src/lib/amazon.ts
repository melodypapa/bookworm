import fetch, { Response } from "node-fetch";
import * as cheerio from "cheerio";

export type Book = {
    name: string;
    uri: string;
    publisher?: string;
    edition?: string;
    publishDate? : {year: number, month: number, day?: number};
    asin: string;
    isbn10?: string;
    isbn13?: string;
    language?: string;
    paperback?: string;
};


export class AmazonBookworm {
    /** The name list for each month  */
    private months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

    constructor() {
    }

    private convertMonth(month: string): number {
        for (let idx = 0; idx < this.months.length; idx ++){
            if (this.months[idx] === month){
                return idx + 1;
            }
        }
        return 0;
    }

    private stripBlank(str: string): string{
        return str.trim();
    }

    public fetchBook(asin: string): Promise<Book> {
        return new Promise(async (resolve, reject) => {
            try {
                const uri: string = `https://www.amazon.com/dp/${asin}`;
                const resp: Response = await fetch(uri);
                const body: string = await resp.text();
                const $ = cheerio.load(body);
                const detailKeyTags = $("span.a-list-item>span:even", ".detail-bullet-list");
                const detailValueTags = $("span.a-list-item>span:odd", ".detail-bullet-list");
                const book: Book = {
                    name: this.stripBlank($('#productTitle').text()),
                    uri: uri,
                    asin: asin
                };
                
                const details = {};
                for (let idx = 0; idx < detailKeyTags.length; idx ++){
                    const key = $(detailKeyTags[idx]).text().replace(/[\s:]+/ , "").toLowerCase();
                    const value = $(detailValueTags[idx]).text();
                    switch (key){
                        case "publisher":
                            const match =  value.match(/([\w\s']+);?([\w\s]+)?\s?\((\w+)\s+(\d{1,2}),\s+(\d{4})\)/);
                            if (match){
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
                }
                resolve(book);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
