import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { JsonService } from '@services/json.service';
import { ELogColor, UtilsService } from '@services/utils.service';

import { ChartInterval } from '../types/chart';

@Injectable()
export class WebScraperService implements OnModuleInit {
  private page: Page;
  private browser: Browser;
  private scraperTargetUrl: string;

  private coloredLog = (color: ELogColor, text: string) =>
    this.utilsService.coloredLog(color, text);

  private coloredText = (color: ELogColor, text: string) =>
    this.utilsService.coloredText(color, text);

  constructor(
    private readonly jsonService: JsonService,
    private readonly utilsService: UtilsService,
    private readonly configService: ConfigService,
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
    this.browser = await puppeteer.launch({ headless: false });

    // Définir les cookies d'authentification
    const cookieJsonFileName = `jsons/cookie.json`;
    const cookieData = await this.jsonService.readJsonFile(cookieJsonFileName);

    if (cookieData && Object.keys(cookieData).length > 0) {
      cookieData.map((cookie) => {
        if (!cookie.expires) {
          if (cookie.expirationDate) {
            cookie.expires = Number(cookie.expirationDate);
          } else {
            cookie.expires = -1;
          }
          delete cookie.expirationDate;
        }
        delete cookie.hostOnly;
        delete cookie.sameSite;
        delete cookie.storeId;
        delete cookie.id;
        if (!cookie.size) cookie.size = -1;
        return cookie;
      });

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

    await this.page.goto(url, { waitUntil: 'networkidle2' });

    const content = await this.page.content();

    const $ = cheerio.load(content);

    const layoutAreaTopLeft = $('.layout__area--topleft').length === 1;
    console.log('isLogged:', layoutAreaTopLeft);

    if (layoutAreaTopLeft) {
      await this.selectSymbol('ETHEUR', 'Kraken', $);

      await this.selectInterval('1D', $);

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

    await this.page.waitForSelector('[data-name="popup-menu-container"]');

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
