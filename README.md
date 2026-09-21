# web-scraper

Este é um **projeto de estudo** criado com o objetivo de aprender boas práticas de arquitetura em TypeScript, organização de código, web scraping com [Playwright](https://playwright.dev/) e exposição de dados via API REST com [Express](https://expressjs.com/).

Atualmente, o scraper coleta informações do **Vatican News**, na página **"Santo do Dia"**, extraindo o nome e a biografia resumida do(s) santo(s) celebrado(s) na data. Esses dados podem ser consumidos de duas formas: rodando o projeto direto pelo terminal, ou através de uma API REST, pronta para ser consumida por um front-end.

A arquitetura foi pensada para ser **extensível**: é possível adicionar scrapers de outras fontes (sites de cupons, notícias, promoções, etc.) sem precisar alterar o código já existente.

---

## 📋 Funcionalidades

- Abre a página do Vatican News (`/pt/santo-do-dia.html`) usando um navegador Chromium controlado pelo Playwright.
- Identifica automaticamente cada bloco de santo na página, mesmo quando há mais de um santo no mesmo dia.
- Extrai o **nome** e a **biografia resumida** de cada santo.
- Lança um erro proposital caso nenhum santo seja encontrado (sinal de que o seletor pode estar desatualizado), em vez de retornar silenciosamente um resultado vazio.
- Trata erros de forma isolada: se a extração falhar, o programa não quebra — ele retorna um resultado indicando a falha, com uma mensagem explicando o motivo.
- Reaproveita o mesmo `Browser` durante toda a execução, e isola cada extração num `BrowserContext` próprio, evitando o custo de abrir/fechar um processo de navegador a cada operação.
- Expõe os dados via **API REST** (endpoint `GET /api/saint-day`), buscando sempre a informação mais atual do site na hora da requisição — sem cache, para nunca ficar com dado desatualizado.
- Pode rodar tanto em **modo CLI** (uma execução, imprime no terminal e encerra) quanto em **modo servidor** (fica no ar, respondendo requisições).

---

## 🛠️ Tecnologias utilizadas

- [Node.js](https://nodejs.org/) — ambiente de execução JavaScript/TypeScript.
- [TypeScript](https://www.typescriptlang.org/) — tipagem estática sobre o JavaScript.
- [Playwright](https://playwright.dev/) — automação de navegador (abre páginas, interage com elementos, extrai dados).
- [Express](https://expressjs.com/) — framework para expor os dados coletados via API REST.
- [cors](https://www.npmjs.com/package/cors) — middleware do Express que libera o acesso à API a partir de outras origens (necessário para um front-end rodando em outra porta/domínio consumir a API).
- [tsx](https://tsx.is/) — executa arquivos `.ts` diretamente (com modo `watch`, que reinicia automaticamente ao salvar alterações), sem precisar compilar manualmente a cada execução durante o desenvolvimento.

---

## 📦 Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado (recomendado LTS mais recente).
- Um gerenciador de pacotes (`npm`, que já vem junto com o Node.js).

### Passo a passo (projeto já clonado)

1. Clone o repositório e entre na pasta do projeto:

   ```bash
   git clone https://github.com/Guguinh0/web-scraper.git
   cd web-scraper
   ```

2. Instale as dependências do projeto (já listadas no `package.json`):

   ```bash
   npm install
   ```

3. Baixe o navegador Chromium que o Playwright utiliza (esse passo é separado, porque o pacote `playwright` só instala o "controlador", não o navegador em si):

   ```bash
   npx playwright install chromium
   ```

### Caso queira montar um projeto do zero, nesses mesmos moldes

```bash
npm init -y
npm install -D typescript @types/node tsx
npm install playwright express cors
npm install -D @types/express @types/cors
npx playwright install chromium
npx tsc --init
```

---

## ▶️ Como usar

### Modo CLI (uma execução avulsa)

Roda o scraper uma vez, imprime o resultado no terminal e encerra:

```bash
npm run dev
```

Saída esperada:

```ts
{
  siteId: 'vatican-news-saints',
  status: 'success',
  data: [
    { name: 'Nome do Santo', bio: 'Biografia resumida...' }
  ]
}
```

Caso algo dê errado durante a extração (por exemplo, o site tenha mudado de estrutura), o resultado virá assim:

```ts
{
  siteId: 'vatican-news-saints',
  status: 'error',
  data: [],
  error: 'Mensagem explicando o que aconteceu'
}
```

### Modo API (servidor fica no ar)

Sobe um servidor Express, que fica escutando requisições até ser encerrado manualmente:

```bash
npm run dev:api
```

Ao subir, o navegador Chromium é aberto **uma única vez** (e reaproveitado em todas as requisições seguintes, evitando o custo de abrir um navegador novo a cada chamada). Você verá no terminal:

```
API rodando em http://localhost:3000
```

Endpoint disponível:

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/saint-day` | Retorna o(s) santo(s) do dia, extraídos em tempo real do Vatican News |

Exemplo de chamada:

```bash
curl http://localhost:3000/api/saint-day
```

A resposta segue o mesmo formato do modo CLI, com o código HTTP `200` em caso de sucesso e `502` caso a extração falhe.

> A API tem CORS habilitado (liberado para qualquer origem), então pode ser consumida diretamente por um front-end rodando em outra porta ou domínio (ex: `localhost:5173`).

### Outros comandos

```bash
npm run build   # compila o projeto TypeScript para JavaScript puro (gera a pasta dist/)
npm start       # roda a versão já compilada (modo CLI)
```

---

## 🧱 Arquitetura do projeto

```
src/
├── api/
│   ├── server.ts                 # Cria o app Express, registra as rotas e inicia o servidor
│   └── routes/
│       └── saints.routes.ts      # Reservado para organizar as rotas separadamente do server.ts
│
├── core/
│   ├── browser/
│   │   └── BrowserManager.ts     # Gerencia o ciclo de vida do navegador (Browser/Context/Page)
│   ├── scraper/
│   │   └── Scraper.ts            # Contrato genérico (interface) que todo scraper deve seguir
│   └── runner/
│       ├── ScraperRunner.ts      # Executa um scraper, isolando erros num try/catch
│       └── RunnerResult.ts       # Formato do resultado de uma execução
│
├── models/
│   └── Saint.ts                  # Formato dos dados extraídos do Vatican News (name, bio)
│
├── scrapers/
│   └── SaintScraper.ts           # Lógica de extração específica do Vatican News
│
└── index.ts                      # Ponto de entrada do modo CLI
```

**Ideia central:** nem `index.ts`, nem `api/server.ts`, nem o `ScraperRunner` sabem nada sobre o HTML de nenhum site específico. Toda a lógica de "como extrair os dados" fica isolada dentro de uma classe de scraper própria (em `src/scrapers/`), que implementa a interface `Scraper<T>`. Isso é o que permite adicionar novos sites, ou uma nova forma de expor os dados (como a API), sem alterar o que já existe.

Resumo de cada peça:

- **`BrowserManager`** — cria e fecha o `Browser` (`init()`/`close()`), e expõe `withPage()`, que cria um `BrowserContext` isolado, abre uma `Page` dentro dele, executa a função recebida, e garante o fechamento do contexto no final (mesmo se der erro).
- **`Scraper<T>`** — interface genérica: define que todo scraper tem um `siteId`, uma `startUrl` e um método `extract(page)` que devolve uma lista de `T`.
- **`ScraperRunner`** — recebe um `BrowserManager` e executa um `Scraper<T>` dentro de um `try/catch`, devolvendo sempre um `RunnerResult<T>` (nunca deixa o erro "escapar" e derrubar o programa).
- **`RunnerResult<T>`** — formato padronizado do resultado: `siteId`, `status` (`"success"` ou `"error"`), `data` e, se houver falha, `error`.
- **`api/server.ts`** — camada de API: cria **uma única instância** de `BrowserManager` e `ScraperRunner`, compartilhada por todas as requisições (evitando reabrir o navegador a cada chamada), e expõe as rotas HTTP que chamam o `ScraperRunner` por baixo dos panos.

---

## ➕ Como adicionar um scraper para outro site

Suponha que você queira criar um scraper para um site chamado `MeuSiteDeCupons`. Siga os passos abaixo:

### 1. Crie o modelo de dados

Em `src/models/`, crie um arquivo representando o que aquele site oferece. Por exemplo, `src/models/Coupon.ts`:

```ts
export interface Coupon {
    store: string;
    title: string;
    code?: string;
    url: string;
}
```

> Use `?` em propriedades que podem não existir em todos os itens extraídos (ex: nem todo cupom tem um código).

### 2. Crie o scraper em `src/scrapers/`

`src/scrapers/CouponScraper.ts`:

```ts
import { Page } from "playwright";
import { Scraper } from "../core/scraper/Scraper";
import { Coupon } from "../models/Coupon";

export class CouponScraper implements Scraper<Coupon> {
    readonly siteId = "meu-site-de-cupons";
    readonly startUrl = "https://www.meusitedecupons.com/promocoes";

    async extract(page: Page): Promise<Coupon[]> {
        await page.goto(this.startUrl);

        const items = page.locator(".seletor-do-card-de-cupom");
        const quant = await items.count();

        if (quant === 0) {
            throw new Error("Nenhum cupom encontrado.");
        }

        const result: Coupon[] = [];

        for (let i = 0; i < quant; i++) {
            const item = items.nth(i);

            const store = await item.locator(".seletor-do-nome-da-loja").first().textContent();
            const title = await item.locator(".seletor-do-titulo").first().textContent();

            result.push({
                store: store?.trim() ?? "",
                title: title?.trim() ?? "",
                url: this.startUrl,
            });
        }

        return result;
    }
}
```

> Os seletores CSS (`.seletor-do-card-de-cupom`, etc.) precisam ser descobertos inspecionando o HTML real do site alvo, usando as ferramentas de desenvolvedor do navegador (botão direito → "Inspecionar"). Sempre use `.first()` ao pegar texto de um `locator` que pode casar com mais de um elemento — evita quebrar por "strict mode violation" do Playwright.

### 3. Use o novo scraper no modo CLI (`index.ts`)

```ts
import { BrowserManager } from "./core/browser/BrowserManager";
import { ScraperRunner } from "./core/runner/ScraperRunner";
import { CouponScraper } from "./scrapers/CouponScraper";

async function main() {
    const browserManager = new BrowserManager();
    await browserManager.init();

    const runner = new ScraperRunner(browserManager);
    const scraper = new CouponScraper();

    const result = await runner.run(scraper);
    console.log(result);

    await browserManager.close();
}

main();
```

### 4. Ou exponha o novo scraper via API (`api/server.ts`)

Basta adicionar uma nova rota, reaproveitando o mesmo `runner` que já existe:

```ts
app.get("/api/coupons", async (req, res) => {
    const scraper = new CouponScraper();
    const result = await runner.run(scraper);

    if (result.status === "error") {
        res.status(502).json(result);
        return;
    }

    res.json(result);
});
```

Pronto — nenhum arquivo dentro de `core/` precisou ser alterado para isso funcionar, seja no modo CLI ou na API.

---

## 🔍 Dicas para descobrir os seletores certos de um novo site

1. Abra o site no navegador e use o botão direito → **"Inspecionar"** em cima do elemento que você quer extrair.
2. Procure o elemento "pai" que agrupa **um item completo** (ex: um cupom inteiro, com nome da loja, título e link) — sem incluir o item seguinte.
3. Teste o seletor encontrado contando quantos elementos ele retorna (`await page.locator(seletor).count()`) e comparando com a quantidade real de itens visíveis na página.
4. Cuidado com classes muito genéricas (como `section` ou `card`), que podem casar com elementos que não são o que você quer. Combine classes mais específicas, ou use `:has()` para filtrar (foi exatamente essa estratégia usada no `SaintScraper`, com `.section--evidence:has(h2)`).
5. Sempre use `.first()` ao extrair texto de um elemento que pode se repetir dentro do item (ex: mais de um `<p>`), evitando erros de "strict mode" do Playwright.

---

## 📝 Observações

- Este projeto tem finalidade **educacional**. Ao criar scrapers para outros sites, respeite o `robots.txt`, os termos de uso de cada site e evite volumes de requisição abusivos.
- A rota `GET /api/saint-day` não tem cache: cada requisição dispara uma extração nova, garantindo dado sempre atualizado, ao custo de cada resposta demorar o tempo de um scraping completo (geralmente poucos segundos). Nesse caso, melhorias serão implementadas futuramente.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
