import { Page } from "playwright";
import { Scraper } from "../scraper/Scraper";
import { RunnerResult } from "./RunnerResult";
import { BrowserManager } from "../browser/BrowserManager";

export class ScraperRunner{
    constructor(private readonly browserManager: BrowserManager){}


    async run<T>(scraper: Scraper<T>): Promise<RunnerResult<T>>{

        try{
            const data = await this.browserManager.withPage((page: Page) => scraper.extract(page));

            return {siteId: scraper.siteId, status: "success", data};
        }catch(error){
            return{
                siteId: scraper.siteId,
                status: "error",
                data: [],
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
