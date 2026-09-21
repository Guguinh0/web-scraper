import {chromium, Browser, Page} from "playwright";

export class BrowserManager{
    private browser: Browser | null = null;

    async init(): Promise<void>{
        this.browser = await chromium.launch({ headless: true});
    }

    async close(): Promise<void>{

        if(this.browser){
            await this.browser.close();
            this.browser = null;
        }

    }

    async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T>{
        if(!this.browser){
            throw new Error("Browser não inicializado.");
        }
        const context = await this.browser.newContext();
        const page = await context.newPage();

        try{
            return await fn(page);
        }finally{
            await context.close();
        }

    }

}
