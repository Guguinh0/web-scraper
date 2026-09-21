import { Page } from "playwright";
import { Scraper } from "../core/scraper/Scraper";
import { Saint } from "../models/Saint";

export class SaintScraper implements Scraper<Saint>{
    readonly siteId = "vatican-news-saints";
    readonly startUrl = "https://www.vaticannews.va/pt/santo-do-dia.html";

    async extract(page: Page): Promise<Saint[]> {
        await page.goto(this.startUrl);

        const sections = page.locator(".section--evidence:has(h2)");
        const quant = await sections.count();

        if(quant === 0){
            throw new Error("Nenhum santo encontrado.")
        }

        const result: Saint[] = [];

        console.log(quant)

        for(let i = 0; i < quant; i++){
            const section = sections.nth(i);
            
            const name = await section.locator("h2").textContent();
            const bio = await section.locator("p").first().textContent();

            result.push({
                name: name?.trim() ?? "",
                bio: bio?.trim() ?? "",
            });
        }

        return result;
    }

}
