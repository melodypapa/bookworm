import fetch, { Response } from "node-fetch";
import * as cheerio from "cheerio";


class AmazonBookworm {
    private uri;

    constructor(private isbn: string) {
        this.uri = `https://www.amazon.com/dp/${this.isbn}`;
    }

    public fetchBook() {
        fetch(this.uri)
        .then((res: Response) => res.text())
        .then((body: string) => {
            //console.log(body);
            const $ = cheerio.load(body);
            console.log($('ul.detail-bullet-list').cl)
        })
        .catch((err) => {
            console.error(err);
        });
    }
}

const bookworm = new AmazonBookworm("1838987576");
bookworm.fetchBook();