import { Page } from "playwright";

export interface Scraper<T> {
    readonly siteId: string;
    readonly startUrl: string;
    extract(page: Page): Promise<T[]>;
}
