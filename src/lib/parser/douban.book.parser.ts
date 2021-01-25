import fetch, { Response } from 'node-fetch';
import { Book } from '../model/book.type';
import { BookParser } from './book.parser';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import { Console } from 'console';

export class DoubanBookParser extends BookParser {

    private searchBook(isbn: string): Promise<string | undefined> {
        return new Promise(async (resolve, reject) => {
            try {
                const uri: string = `https://search.douban.com/book/subject_search?search_text=${isbn}&cat=1001`;
                const browser = await puppeteer.launch({ headless: true });
                const page = await browser.newPage();
                await page.goto(uri);
                await page.screenshot({ path: 'c:\\tmp\\example.png' });
                const body: string = await page.content();
                
                //console.log(body);
                const $ = cheerio.load(body);
                
                const regexLink = /https:\/\/book\.douban\.com\/subject\/\d+\//;
                const results = $('.item-root a');
                if (results.length === 0){
                    throw new BookWormError("Book can not be found");
                }
                await browser.close();
                for (let idx = 0; idx < results.length; idx ++) {
                    if ($(results[idx]).attr('href')?.match(regexLink)){
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
                if (uri === undefined){
                    throw new BookWormError("Book can not be found");
                }

                const browser = await puppeteer.launch({ headless: false });
                const page = await browser.newPage();
                await page.goto(uri);
                await page.screenshot({ path: 'c:\\tmp\\example.png' });
                const body: string = await page.content();
                
                //console.log(body);
                const $ = cheerio.load(body);
                const regex = /https:\/\/book\.douban\.com\/subject\/\d+\//;
                const results = $('.item-root a');
                if (results.length === 0){
                    throw new BookWormError("Book can not be found");
                }
                // await page.goto($(results?[0]).attr('href'));
                await browser.close();
                const book: Book = {
                    name: "",
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