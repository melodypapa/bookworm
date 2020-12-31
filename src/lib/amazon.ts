import fetch, { Response } from "node-fetch";
import * as cheerio from "cheerio";

export type Book = {
    name: string
};


export class AmazonBookworm {
    private uri;

    constructor(private isbn: string) {
        this.uri = `https://www.amazon.com/dp/${this.isbn}`;
    }

    public fetchBook(): Promise<Book> {
        return new Promise(async (resolve, reject) => {
            try {
                const resp: Response = await fetch(this.uri);
                const body: string = await resp.text();
                const $ = cheerio.load(body);
                const book: Book = {
                    name: $('#productTitle').text(),
                };
                resolve(book);
            }
            catch(err){
                reject(err);
            }
        });
    }
}

