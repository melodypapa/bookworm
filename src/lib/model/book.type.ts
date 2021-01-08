export type Book = {
    name: string;
    uri: string;
    publisher?: string;
    edition?: string;
    publishDate?: { year: number, month: number, day?: number };
    asin?: string;
    isbn10?: string;
    isbn13?: string;
    language?: string;
    paperback?: string;
};