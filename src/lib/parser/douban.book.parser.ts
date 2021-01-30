import { BookParser } from './book.parser';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import { BookWormError } from '../error/bookworm.error';
import { Book } from '../model/book.type';

export class DoubanBookParser extends BookParser {

    private searchBook(isbn: string): Promise<string | undefined> {
        return new Promise(async (resolve, reject) => {
            try {
                const uri: string = `https://search.douban.com/book/subject_search?search_text=${isbn}&cat=1001`;
                const browser = await puppeteer.launch({ 
                    headless: false, 
                    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 
                    ignoreDefaultArgs: ['--disable-extensions'] });
                const page = await browser.newPage();
                await page.goto(uri);
                // await page.screenshot({ path: 'c:\\tmp\\example.png' });
                const html: string = await page.content();

                //console.log(body);
                const $ = cheerio.load(html);

                const regexLink = /https:\/\/book\.douban\.com\/subject\/\d+\//;
                const results = $('.item-root a');
                if (results.length === 0) {
                    throw new BookWormError("Book can not be found");
                }
                await browser.close();
                for (let idx = 0; idx < results.length; idx++) {
                    if ($(results[idx]).attr('href')?.match(regexLink)) {
                        resolve($(results[idx]).attr('href'));
                        return;
                    }
                }
                throw new BookWormError("Book can not be found");
            }
            catch (err) {
                reject(err);
            }
        });
    }

    public fetchBook(isbn: string): Promise<Book> {
        return new Promise(async (resolve, reject) => {
            try {
                const uri = await this.searchBook(isbn);
                if (uri === undefined) {
                    throw new BookWormError("Book can not be found");
                }

                const browser = await puppeteer.launch({ headless: false, ignoreDefaultArgs: ['--disable-extensions']});
                const page = await browser.newPage();
                await page.goto(uri);
                // await page.screenshot({ path: 'c:\\tmp\\example.png' });
                const body: string = await page.content();

                //console.log(body);
                const $ = cheerio.load(body);
                //let bookinfo = $('#info').text().replace(/\n+/g, "\n");
                let bookinfo = $('#info').text();
                bookinfo = bookinfo.replace(/\s+/g, " ").trim();
                await browser.close();
                const book: Book = {
                    name: $('#wrapper h1').text(),
                    uri: uri,
                };

                resolve(book);
            }
            catch (err) {
                reject(err);
            }
        });
    }

}