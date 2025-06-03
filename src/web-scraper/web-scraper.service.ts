import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import puppeteer, { Browser, LaunchOptions, Page } from 'puppeteer';
import { executablePath } from 'puppeteer';
import * as cheerio from 'cheerio';
import { ELogColor, UtilsService } from '@services/utils.service';

import { ChartInterval } from '../types/chart';
import { GetStrategyDataParams } from '../types/strategy-data.type';
import { CookiesService } from '../cookies/cookies.service';

@Injectable()
export class WebScraperService implements OnModuleInit {
  private page: Page;
  private browser: Browser;
  private scraperTargetUrl: string;

  private isProduction = process.env.NODE_ENV === 'production';

  private coloredLog = (color: ELogColor, text: string) =>
    this.utilsService.coloredLog(color, text);

  private coloredText = (color: ELogColor, text: string) =>
    this.utilsService.coloredText(color, text);

  constructor(
    private readonly utilsService: UtilsService,
    private readonly configService: ConfigService,
    private readonly cookiesService: CookiesService,
  ) {
    this.scraperTargetUrl =
      this.configService.get<string>('SCRAPER_TARGET_URL');
  }

  onModuleInit() {
    this.start();
  }

  public async start() {
    await this.utilsService.waitSeconds(1000);

    console.log('★ Init Puppeteer');
    await this.initPuppeteer();

    await this.scrape(this.scraperTargetUrl);
  }

  async initPuppeteer() {
    console.log('executablePath:', executablePath());
    let options: LaunchOptions;
    if (this.isProduction) {
      options = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: executablePath(),
      };
    } else {
      options = { headless: false };
    }
    this.browser = await puppeteer.launch(options);

    // Définir les cookies d'authentification
    const rawCookies = await this.cookiesService.findAll();
    console.log('Cookies from database:', rawCookies.length);

    const cookieData = rawCookies
      .filter(
        (c) =>
          typeof c.name === 'string' &&
          typeof c.value === 'string' &&
          typeof c.domain === 'string' &&
          c.name.trim() !== '' &&
          c.domain.trim() !== '',
      )
      .map((c) => ({
        name: c.name.trim(),
        value: c.value.trim(),
        domain: c.domain.trim(),
        path: c.path ?? '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        expires: c.expirationDate
          ? Math.floor(new Date(c.expirationDate).getTime() / 1000)
          : undefined,
      }));

    if (cookieData && Object.keys(cookieData).length > 0) {
      await this.browser.setCookie(...cookieData);
    }

    this.page = await this.browser.newPage();

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.31',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64; rv:118.0) Gecko/20100101 Firefox/118.0',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:118.0) Gecko/20100101 Firefox/118.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_2) AppleWebKit/537.36 (KHTML, like Gecko) BraveSoftware/1.16.72 Chrome/117.0.0.0 Safari/537.36',
    ];

    const randomUserAgent =
      userAgents[Math.floor(Math.random() * userAgents.length)];
    console.log(
      'Random User-Agent:',
      this.coloredText(ELogColor.FgMagenta, randomUserAgent),
    );

    await this.page.setUserAgent(randomUserAgent);
  }

  async scrape(url: string): Promise<any> {
    console.log(`Launching browser to scrape: ${url}`);

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await this.utilsService.waitSeconds(1000);

    const content = await this.page.content();

    const $ = cheerio.load(content);

    const layoutAreaTopLeft = $('.layout__area--topleft').length === 1;
    console.log('isLogged:', layoutAreaTopLeft);

    if (layoutAreaTopLeft) {
      await this.selectSymbol('ETHEUR', 'Kraken', $);

      await this.selectInterval('1D', $);

      // 'Machine Learning: kNN-based Strategy (update)'
      // strategyTitle: 'Machine Learning: Lorentzian Classification',
      // shortStrategyTitle: 'Lorentzian Classification',
      const strategyData = await this.getStrategyData({
        strategyTitle: 'Machine Learning Adaptive SuperTrend [AlgoAlpha]',
        shortStrategyTitle: 'AlgoAlpha - 🤖 Adaptive SuperTrend',
        $,
      });
      console.log('strategyData:', strategyData);

      await this.utilsService.waitSeconds(1000);
    } else {
      this.coloredLog(ELogColor.FgRed, `Your are not logged!`);
    }

    // await this.browser.close();

    return;
  }

  async selectSymbol(symbol: string, exchange: string, $: cheerio.CheerioAPI) {
    const domSelector = '#header-toolbar-symbol-search';

    await this.page.click(domSelector);
    await this.utilsService.waitSeconds(1000);

    await this.page.type('[data-role="search"]', symbol);

    await this.utilsService.waitSeconds(1000);

    const textToFound = exchange;
    await this.clickElementByText(
      this.page,
      textToFound,
      '[data-role="list-item"]',
      '[data-name="symbol-search-items-dialog"]',
    );

    await this.utilsService.waitSeconds(1000);

    const newHtml = await this.page.content();
    $ = cheerio.load(newHtml);

    console.log(
      'Selected symbol:',
      this.coloredText(ELogColor.FgYellow, $(domSelector).text()),
    );
    return $(domSelector).text() === symbol;
  }

  async selectInterval(interval: ChartInterval, $: cheerio.CheerioAPI) {
    const domSelector = '#header-toolbar-intervals';

    await this.page.click(domSelector);
    await this.utilsService.waitSeconds(1000);

    await this.page.evaluate((targetInterval) => {
      const container = document.querySelector(
        '[data-name="popup-menu-container"]',
      );
      if (!container) return;

      const item = container.querySelector(
        `[data-role="menuitem"][data-value="${targetInterval}"]`,
      );
      if (item) {
        (item as HTMLElement).click();
      }
    }, interval);

    await this.utilsService.waitSeconds(1000);

    const newHtml = await this.page.content();
    $ = cheerio.load(newHtml);

    console.log(
      'Selected interval:',
      this.coloredText(ELogColor.FgYellow, $(domSelector).text()),
    );

    return $(domSelector).text();
  }

  async getStrategyData(params: GetStrategyDataParams) {
    const { strategyTitle, shortStrategyTitle, $, attempt = 1 } = params;
    const maxAttempts = 5;

    if ($('[data-name="widgetbar-pages-with-tabs"]').length === 0) {
      await this.page.click(
        '[data-name="right-toolbar"] [data-name="object_tree"]',
      );
      await this.utilsService.waitSeconds(1000);
    }

    if ($('.chart-data-window').length === 0) {
      await this.page.click(
        '#union-object-tree-widget-switcher button#data-window',
      );
      await this.utilsService.waitSeconds(1000);
    }

    const item = await this.page.evaluate(
      (title, shortTitle) => {
        const container = document.querySelector(
          '.chart-data-window [role="treegrid"]',
        );
        if (!container) return null;

        const menuItems = container.querySelectorAll('[data-role="menuitem"]');
        const match = Array.from(menuItems).find((el) => {
          const text = el.textContent?.trim();
          return text?.includes(title) || text?.includes(shortTitle);
        });

        return match ? match.outerHTML : null;
      },
      strategyTitle,
      shortStrategyTitle,
    );

    let result = [];
    if (item) {
      result = this.parseHtmlToJson(item);
    } else {
      await this.selectIndicator({
        strategyTitle,
        $,
        shortStrategyTitle,
      });
    }

    if (result.length > 0) {
      return result;
    } else if (attempt < maxAttempts) {
      console.log(`getStrategyData RETRY #${attempt} — waiting 1s...`);
      await this.utilsService.waitSeconds(1000);
      return await this.getStrategyData({
        strategyTitle,
        $,
        shortStrategyTitle,
        attempt: attempt + 1,
      });
    }

    throw new Error(`getStrategyData failed after ${maxAttempts} attempts`);
  }

  async cleanIndicators() {
    await this.page.evaluate(() => {
      const container = document.querySelector(
        '[data-name="removeAllDrawingTools"]',
      );
      if (!container) return;

      const button = Array.from(container.querySelectorAll('button')).find(
        (btn) => !btn.querySelector('[class^="arrowIcon"]'),
      );

      if (button) {
        (button as HTMLElement).click();
      }
    });

    await this.utilsService.waitSeconds(1000);

    await this.page.click(
      '#overlap-manager-root [data-name="popup-menu-container"] [data-name="menu-inner"] [data-name="remove-studies"]',
    );

    await this.utilsService.waitSeconds(1000);
  }

  async selectIndicator(params: GetStrategyDataParams) {
    const { strategyTitle, shortStrategyTitle } = params;
    let $ = params.$;

    await this.cleanIndicators();
    await this.utilsService.waitSeconds(1000);

    await this.page.click('[data-name="open-indicators-dialog"]');
    await this.utilsService.waitSeconds(1000);

    await this.page.type(
      '[data-name="indicators-dialog"] [data-role="search"]',
      strategyTitle,
    );

    await this.utilsService.waitSeconds(1000);

    const textToFound = strategyTitle;
    await this.clickElementByText(
      this.page,
      textToFound,
      '[data-role="list-item"]',
      '[data-name="indicators-dialog"] [data-role="dialog-content"]',
    );

    await this.utilsService.waitSeconds(1000);

    await this.page.click(
      '[data-name="indicators-dialog"] [data-name="close"]',
    );

    await this.utilsService.waitSeconds(1000);

    const newHtml = await this.page.content();
    $ = cheerio.load(newHtml);

    $('.chart-markup-table [data-name="legend-source-title"]').each(
      (index, el) => {
        const text = $(el).text().trim();

        if (text === shortStrategyTitle) {
          console.log(
            `✅ Exact match found for strategy title: "${shortStrategyTitle}"`,
          );
        } else if (text.includes(shortStrategyTitle)) {
          console.log(
            `☑ Partial match found for strategy title: "${shortStrategyTitle}" in "${text}"`,
          );
        }
      },
    );
  }

  /**
   * Parses HTML content of a TradingView-style value container and returns structured data.
   *
   * @param html - The raw HTML string to parse.
   * @returns An array of objects containing title and value for each data item.
   */
  private parseHtmlToJson(html: string): { title: string; value: string }[] {
    const $ = cheerio.load(html);
    const result: { title: string; value: string }[] = [];

    $('[class^="item-"]').each((_, el) => {
      const title = $(el).find('[data-test-id-value-title]').text().trim();
      const value = $(el).find('span').text().trim();

      if (title && value) {
        result.push({ title, value });
      }
    });

    return result;
  }

  /**
   * Clique sur un élément contenant un texte donné dans un conteneur spécifique.
   *
   * @param page - Instance Puppeteer
   * @param text - Texte à rechercher dans l'élément
   * @param selector - Sélecteur CSS de la liste d'éléments à parcourir
   * @param containerSelector - (Optionnel) Conteneur parent pour restreindre la recherche
   */
  async clickElementByText(
    page: Page,
    text: string,
    selector: string,
    containerSelector?: string,
  ): Promise<boolean> {
    return await page.evaluate(
      ({ text, selector, containerSelector }) => {
        const scope = containerSelector
          ? document.querySelector(containerSelector)
          : document;

        if (!scope) return false;

        const elements = scope.querySelectorAll(selector);
        for (const el of elements) {
          if (el.textContent?.includes(text)) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      },
      { text, selector, containerSelector },
    );
  }
}
