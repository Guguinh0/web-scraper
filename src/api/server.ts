import express from "express";
import cors from "cors";
import { BrowserManager } from "../core/browser/BrowserManager";
import { ScraperRunner } from "../core/runner/ScraperRunner";
import { SaintScraper } from "../scrapers/SaintScraper";

const app = express();

const PORT = 3000;

app.use(cors());

const browserManager = new BrowserManager();

const runner = new ScraperRunner(browserManager);



app.get("/api/saint-day", async (req, res) =>{

    const scraper = new SaintScraper();
    const result = await runner.run(scraper);

    if(result.status === "error"){
        res.status(502).json(result);
        return;
    }

    res.json(result)
});


async function start(){

    await browserManager.init();
    app.listen(PORT, () => {
        console.log(`API rodando em http://localhost:${PORT}`);
    });

}

start();
