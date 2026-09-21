import { BrowserManager } from "./core/browser/BrowserManager";
import { ScraperRunner } from "./core/runner/ScraperRunner";
import { SaintScraper } from "./scrapers/SaintScraper";

async function main(){
    const browserManager = new BrowserManager();

    await browserManager.init();

    const runner = new ScraperRunner(browserManager);
    const saintsScraper = new SaintScraper();

    const result = await runner.run(saintsScraper);

    console.log(result);

    await browserManager.close();
}

main();