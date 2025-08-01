import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import puppeteer, {
  Browser,
  ElementHandle,
  LaunchOptions,
  Page,
  WaitForSelectorOptions,
} from 'puppeteer';
import { executablePath } from 'puppeteer';
import * as cheerio from 'cheerio';

import { ELogColor, UtilsService } from '@services/utils.service';

import { ChartInterval, chartIntervalMap } from '../types/chart.type';
import { GetStrategyDataParams } from '../types/strategy-data.type';
import { CookiesService } from '../cookies/cookies.service';
import { StrategyDataDto } from './dto/strategy-data.dto';
import {
  MarketSnapshot,
  marketSnapshotTitleMap,
} from '../types/market-snapshot.type';

@Injectable()
export class WebScraperService {
  private readonly logger = new Logger(WebScraperService.name);

  private page: Page;
  private browser: Browser;
  private scraperTargetUrl: string;

  private lastActivityTimestamp: number;
  private inactivityCheckInterval: NodeJS.Timeout;

  private isProduction = process.env.NODE_ENV === 'production';

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

  async launchBrowser() {
    this.logger.log('★ Init Puppeteer');
    this.logger.log('executablePath:', executablePath());

    let options: LaunchOptions;
    if (this.isProduction) {
      options = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        executablePath: executablePath(),
      };
    } else {
      options = { headless: false };
    }
    try {
      this.browser = await puppeteer.launch(options);
    } catch (error) {
      this.logger.error('Erreur lors du lancement de Puppeteer :', error);
    }

    // Définir les cookies d'authentification
    const rawCookies = await this.cookiesService.findAll();
    this.logger.log('Cookies from database:', rawCookies.length);

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
    this.logger.log(
      'Random User-Agent:',
      this.coloredText(ELogColor.FgMagenta, randomUserAgent),
    );

    await this.page.setUserAgent(randomUserAgent);

    if (this.configService.get<boolean>('EMULATE_SLOW_NETWORK') === true) {
      await this.emulateSlowNetwork(this.page);
    }

    this.startInactivityMonitor();
  }

  async emulateSlowNetwork(
    page: Page,
    options = {
      offline: false,
      downloadKbps: 2000,
      uploadKbps: 2000,
      latencyMs: 200,
    },
  ) {
    const client = await page.createCDPSession();

    await client.send('Network.enable');

    await client.send('Network.emulateNetworkConditions', {
      offline: options.offline,
      downloadThroughput: (options.downloadKbps * 1024) / 8,
      uploadThroughput: (options.uploadKbps * 1024) / 8,
      latency: options.latencyMs,
    });

    this.logger.log(
      `⚠ Slow network emulation → ${
        options.offline
          ? 'Offline'
          : `${options.downloadKbps}kbps ↓ / ${options.uploadKbps}kbps ↑ / ${options.latencyMs}ms`
      }`,
    );
  }

  async loadWebPage() {
    const url = this.scraperTargetUrl;
    this.logger.log(`Launching browser to scrape: ${url}`);

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await this.waitForSelectorWithDelay('.js-rootresizer__contents');
    this.logger.log('✅ .js-rootresizer__contents displayed!');

    await this.waitForSelectorWithDelay(
      '.layout__area--top #header-toolbar-symbol-search',
    );
    this.logger.log('✅ #header-toolbar-symbol-search displayed!');

    await this.waitForSelectorWithDelay('.layout__area--left #drawing-toolbar');
    this.logger.log('✅ #drawing-toolbar displayed!');

    await this.waitForSelectorWithDelay(
      '.layout__area--topleft [data-role="button"]',
    );
    this.logger.log('✅ Top left button displayed!');

    await this.waitForSelectorWithDelay('#footer-chart-panel');
    this.logger.log('✅ #footer-chart-panel displayed!');

    // On attend que le réseau soit inactif (ex: AJAX terminé)
    await this.page.waitForNetworkIdle({ idleTime: 500, timeout: 60000 });
    this.logger.log('✅ -------[NETWORK IS IDLE]-------');

    return this.page;
  }

  async closeBrowser() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
        this.logger.log('■ Page closed.');
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.logger.log('■ Browser closed.');
      }
    } catch (error) {
      this.logger.error('❌ Error closing browser:', error);
    }
  }

  private startInactivityMonitor() {
    if (this.inactivityCheckInterval) return;

    this.inactivityCheckInterval = setInterval(async () => {
      const inactivityDuration =
        Date.now() - (this.lastActivityTimestamp ?? Date.now());

      if (inactivityDuration > 3 * 60 * 1000) {
        await this.closeBrowser();
        clearInterval(this.inactivityCheckInterval!);
        this.inactivityCheckInterval = null;
        this.lastActivityTimestamp = null;
      }
    }, 30 * 1000);
  }

  async getStrategyData(params: StrategyDataDto) {
    const { symbol, exchange, interval, strategyTitle, shortStrategyTitle } =
      params;

    this.lastActivityTimestamp = Date.now();

    if (!this.browser || !this.page) {
      await this.launchBrowser();
      await this.loadWebPage();
    }

    const content = await this.page.content();
    const $ = cheerio.load(content);

    const symbolSuccess = await this.selectSymbol(symbol, exchange, $);
    if (!symbolSuccess) {
      throw new Error('Failed to choose symbol');
    }
    const intervalSuccess = await this.selectInterval(interval, $);
    if (!intervalSuccess) {
      throw new Error('Failed to choose interval');
    }

    const marketSnapshotRaw = await this.extractStrategyData({
      strategyTitle: `${symbol.toUpperCase()} · ${chartIntervalMap[interval]} · ${exchange.toUpperCase()}`,
      shortStrategyTitle: null,
      $: $,
    });

    let marketSnapshot: MarketSnapshot;
    if (marketSnapshotRaw?.length > 0) {
      const meta = {
        symbol: symbol.toUpperCase(),
        interval: chartIntervalMap[interval],
        exchange: exchange.toUpperCase(),
      };

      marketSnapshot = this.convertMarketSnapshot(marketSnapshotRaw, meta);
    }

    const strategySnapshot = await this.extractStrategyData({
      strategyTitle,
      shortStrategyTitle,
      $,
    });

    return {
      marketSnapshot,
      strategySnapshot: this.transformParsedData(strategySnapshot),
    };
  }

  async selectSymbol(symbol: string, exchange: string, $: cheerio.CheerioAPI) {
    const domSelector = '#header-toolbar-symbol-search';
    await this.waitForSelectorWithDelay(domSelector);

    if ($('[data-name="symbol-search-items-dialog"]').length == 0) {
      // Open dialog
      await this.page.click(domSelector);
    }

    const symbolSearchItemsDialogSelector =
      '[data-name="symbol-search-dialog-content-item"]';
    const initialCount = await this.page.$$eval(
      symbolSearchItemsDialogSelector,
      (els) => els.length,
    );

    const dataRoleSearchSelector = '[data-role="search"]';
    await this.waitForSelectorWithDelay(dataRoleSearchSelector);
    // Get search input current text
    // const searchInputValue = await this.page.$eval(
    //   dataRoleSearchSelector,
    //   (input: HTMLInputElement) => input.value,
    // );
    // this.logger.log('search input current text:', searchInputValue);

    // Reset input
    await this.page.$eval(dataRoleSearchSelector, (input: HTMLInputElement) => {
      input.value = '';
    });

    await this.page.type(dataRoleSearchSelector, `${exchange}:${symbol}`, {
      delay: 100,
    });

    await this.waitForItemCountChange(
      this.page,
      symbolSearchItemsDialogSelector,
      initialCount,
    );

    const textToFound = exchange;
    const clickedResult = await this.clickElementByText(
      this.page,
      textToFound,
      '[data-role="list-item"]',
      '[data-name="symbol-search-items-dialog"]',
    );

    if (clickedResult) {
      await this.page.waitForFunction(
        (expectedSymbol) => {
          return document
            .querySelector('#header-toolbar-symbol-search')
            ?.textContent?.toUpperCase()
            ?.includes(expectedSymbol.toUpperCase());
        },
        {},
        symbol,
      );
    }

    const newHtml = await this.page.content();
    $ = cheerio.load(newHtml);

    this.logger.log(
      'Selected symbol:',
      this.coloredText(ELogColor.FgYellow, $(domSelector).text()),
    );
    return $(domSelector).text() === symbol;
  }

  async selectInterval(interval: ChartInterval, $: cheerio.CheerioAPI) {
    const domSelector = '#header-toolbar-intervals';
    await this.waitForSelectorWithDelay(domSelector);

    if ($(domSelector).text() === chartIntervalMap[interval]) {
      this.logger.log(
        'Selected interval:',
        this.coloredText(ELogColor.FgYellow, $(domSelector).text()),
        '(already selected)',
      );
      return true;
    }

    // await this.page.click(domSelector);
    await this.page.evaluate((selector) => {
      const el = document.querySelector(selector)?.querySelector('button');
      if (el) {
        (el as HTMLElement).click();
      }
    }, domSelector);

    await this.waitForSelectorWithDelay('[data-name="popup-menu-container"]');

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

    const newHtml = await this.page.content();
    $ = cheerio.load(newHtml);

    this.logger.log(
      'Selected interval:',
      this.coloredText(ELogColor.FgYellow, $(domSelector).text()),
    );

    return $(domSelector).text() === chartIntervalMap[interval];
  }

  async disableAllCurrentIndicators() {
    await this.waitForSelectorWithDelay(
      '[data-name="pane-widget-chart-gui-wrapper"]',
    );

    await this.page.$$eval(
      '[data-name="pane-widget-chart-gui-wrapper"] [data-name="legend-source-item"] .normal-eye',
      (elements) => {
        let count = 0;
        elements.forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none') {
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            count++;
          }
        });
        return count;
      },
    );

    await this.utilsService.waitSeconds(100);
  }

  async extractStrategyData(params: GetStrategyDataParams) {
    const { strategyTitle, shortStrategyTitle, $, attempt = 1 } = params;
    const maxAttempts = 7;

    if (attempt === 1) {
      await this.disableAllCurrentIndicators();
    }

    const rightToolbarSelector = '[data-name="right-toolbar"]';
    const objectTreeButtonSelector = `${rightToolbarSelector} [data-name="object_tree"]`;

    await this.waitForSelectorWithDelay(objectTreeButtonSelector);

    const unionObjectTreeWidgetSwitcherSelector =
      '#union-object-tree-widget-switcher';

    const objectTreeButtonEl = await this.page.$(objectTreeButtonSelector);
    if (objectTreeButtonEl) {
      const isPressed = await this.page.evaluate(
        (el) => el.getAttribute('aria-pressed'),
        objectTreeButtonEl,
      );
      const isNotPressed = isPressed === 'false';
      // const switcherNotPresent =
      //   $(unionObjectTreeWidgetSwitcherSelector).length === 0;
      // this.logger.log(
      //   'objectTreeButtonEl isNotPressed',
      //   isNotPressed,
      //   '||',
      //   'switcherNotPresent',
      //   switcherNotPresent,
      //   '(' + $(unionObjectTreeWidgetSwitcherSelector).length + ')',
      // );
      if (isNotPressed) {
        // || switcherNotPresent
        // this.logger.log('objectTreeButtonEl.click()');
        await objectTreeButtonEl.click();
      }
    }

    await this.waitForSelectorWithDelay(unionObjectTreeWidgetSwitcherSelector);

    const chartDataWindowSelector = '.chart-data-window';
    // this.logger.log(
    //   "$('.chart-data-window').length",
    //   $(chartDataWindowSelector).length,
    // );
    if ($(chartDataWindowSelector).length === 0) {
      const switcherButtonSelector = `${unionObjectTreeWidgetSwitcherSelector} button#data-window`;

      // this.logger.log('click to switch');
      await this.page.click(switcherButtonSelector);

      await this.waitForSelectorWithDelay(chartDataWindowSelector);
    }

    const item = await this.page.evaluate(
      async (title, shortTitle) => {
        // Regarder les logs dans la Chrome DevTools console
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        const container = document.querySelector(
          '.chart-data-window [role="treegrid"]',
        );
        if (!container) return null;

        const menuItems = container.querySelectorAll('[data-role="menuitem"]');
        const index = Array.from(menuItems).findIndex((el) => {
          const text = el.textContent?.trim();
          return text?.includes(title) || text?.includes(shortTitle);
        });

        let btnClicked = false;
        const match = menuItems[index];
        if (match) {
          const hasHiddenClass = Array.from(match.classList).some((cls) =>
            cls.startsWith('hidden-'),
          );

          const secondDiv = match.querySelector('div:nth-child(2)');
          const hasValuesClass = secondDiv
            ? Array.from(secondDiv.classList).some((cls) =>
                cls.startsWith('values-'),
              )
            : false;

          // console.log(
          //   hasHiddenClass
          //     ? '❌ Classe hidden-* trouvée. => On doit cliquer'
          //     : '✅ Classe hidden-* absente.',
          // );
          // console.log(
          //   hasValuesClass
          //     ? '✅ Deuxième div avec classe values-* trouvée.'
          //     : '❌ Deuxième div avec classe values-* absente. => On doit cliquer',
          // );

          if (hasHiddenClass || !hasValuesClass) {
            const button = match.querySelector('button');
            if (button) {
              btnClicked = true;
              // console.log(
              //   '👆 Click sur le bouton car hidden-* ou values-* manquant',
              // );
              button.click();
            }
          } else {
            // console.log(
            //   '🚫 Ni hidden-*, ni absence de values-* : pas de clic.',
            // );
          }
        }

        if (btnClicked) {
          let retries = 20;
          while (retries-- > 0) {
            // console.log('retries', retries);
            const matchItem = Array.from(
              document.querySelectorAll(
                '.chart-data-window [role="treegrid"] [data-role="menuitem"]',
              ),
            ).find((el) => {
              const text = el.textContent?.trim();
              return text?.includes(title) || text?.includes(shortTitle);
            });

            const secondDiv = matchItem.querySelector('div:nth-child(2)');
            // const hasSecondDiv = !!secondDiv;
            // console.log('after click => hasSecondDiv', hasSecondDiv);

            const hasValuesClass = secondDiv
              ? Array.from(secondDiv.classList).some((cls) =>
                  cls.startsWith('values-'),
                )
              : false;
            // console.log('after click => hasValuesClass', hasValuesClass);

            if (hasValuesClass) {
              break;
            }

            await sleep(250);
          }
        }

        // INFO: Renvoyer uniquement des valeurs sérialisables : string, number, boolean, null, object/array simples.
        return match
          ? {
              index,
              outerHTML: match.outerHTML,
              btnClicked,
            }
          : null;
      },
      strategyTitle,
      shortStrategyTitle,
    );

    // this.logger.log('Data Window item:', !!item);

    let result = [];
    if (item) {
      result = this.parseHtmlToJson(item.outerHTML);
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
      const waitMs = 1000;
      this.logger.log(
        `extractStrategyData RETRY #${attempt} — waiting ${waitMs}ms...`,
      );
      await this.utilsService.waitSeconds(waitMs);
      return await this.extractStrategyData({
        strategyTitle,
        $,
        shortStrategyTitle,
        attempt: attempt + 1,
      });
    }

    throw new Error(`extractStrategyData failed after ${maxAttempts} attempts`);
  }

  async cleanIndicators() {
    const removeAllDrawingToolsSelector = '[data-name="removeAllDrawingTools"]';
    await this.waitForSelectorWithDelay(removeAllDrawingToolsSelector);

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

    const popupMenuContainerButtonSelector =
      '#overlap-manager-root [data-name="popup-menu-container"] [data-name="menu-inner"] [data-name="remove-studies"]';
    await this.waitForSelectorWithDelay(popupMenuContainerButtonSelector);

    await this.page.click(popupMenuContainerButtonSelector);
  }

  async selectIndicator(params: GetStrategyDataParams) {
    const { strategyTitle, shortStrategyTitle } = params;
    let $ = params.$;

    await this.cleanIndicators();

    await this.waitForSelectorWithDelay('#header-toolbar-indicators');
    await this.page.click(
      '#header-toolbar-indicators [data-name="open-indicators-dialog"]',
    );

    const indicatorsDialogContentSelector =
      '[data-name="indicators-dialog"] [data-role="dialog-content"]';
    await this.waitForSelectorWithDelay(indicatorsDialogContentSelector);

    const indicatorSearchItemsDialogSelector = `${indicatorsDialogContentSelector} [data-role="list-item"]`;
    const initialCount = await this.page.$$eval(
      indicatorSearchItemsDialogSelector,
      (els) => els.length,
    );

    const indicatorsDialogSearchSelector =
      '[data-name="indicators-dialog"] [data-role="search"]';
    await this.waitForSelectorWithDelay(indicatorsDialogSearchSelector);
    await this.page.type(indicatorsDialogSearchSelector, strategyTitle);

    await this.waitForItemCountChange(
      this.page,
      indicatorSearchItemsDialogSelector,
      initialCount,
    );

    const textToFound = strategyTitle;
    await this.clickElementByText(
      this.page,
      textToFound,
      '[data-role="list-item"]',
      '[data-name="indicators-dialog"] [data-role="dialog-content"]',
    );

    const indicatorTitleSelector =
      '.chart-markup-table [data-name="legend-source-title"]';
    const initialTitleCount = await this.page.$$eval(
      indicatorTitleSelector,
      (els) => els.length,
    );

    await this.page.click(
      '[data-name="indicators-dialog"] [data-name="close"]',
    );

    await this.waitForItemCountChange(
      this.page,
      indicatorTitleSelector,
      initialTitleCount,
    );

    const newHtml = await this.page.content();
    $ = cheerio.load(newHtml);

    const titlesToCheck = [shortStrategyTitle, strategyTitle];
    $(indicatorTitleSelector).each((_, el) => {
      const text = $(el).text().trim();

      for (const title of titlesToCheck) {
        if (text === title) {
          // this.logger.log(
          //   `✅ Exact match found for strategy title: "${title}"`,
          // );
          return;
        } else if (text.includes(title)) {
          this.logger.log(
            `☑ Partial match found for strategy title: "${title}" in "${text}"`,
          );
          return;
        }
      }
    });
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
          if (el.textContent?.toLowerCase().includes(text.toLowerCase())) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      },
      { text, selector, containerSelector },
    );
  }

  /**
   * Waits for the number of elements matching a selector to change from an initial count.
   *
   * @param page - The Puppeteer Page instance.
   * @param selector - The CSS selector of the elements to watch.
   * @param initialCount - The initial number of elements to compare against.
   * @param timeout - Maximum time to wait in milliseconds (default: 10 seconds).
   * @param pollingInterval - Interval between checks in milliseconds (default: 200ms).
   * @returns Resolves to `true` if the count changes before timeout, otherwise `false`.
   */
  async waitForItemCountChange(
    page: Page,
    selector: string,
    initialCount: number,
    timeout = 10000,
    pollingInterval = 200,
  ): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const currentCount = await page.$$eval(selector, (els) => els.length);
      if (currentCount !== initialCount) {
        return true; // ✅ Le nombre a changé
      }
      await new Promise((r) => setTimeout(r, pollingInterval));
    }

    return false; // ❌ Timeout sans changement
  }

  /**
   * Converts a raw array of market snapshot data (with localized titles)
   * into a structured `MarketSnapshot` object.
   */
  convertMarketSnapshot(
    raw: { title: string; value: string }[],
    meta: Pick<MarketSnapshot, 'symbol' | 'interval' | 'exchange'>,
  ): MarketSnapshot {
    const snapshot: Partial<MarketSnapshot> = { ...meta };

    for (const { title, value } of raw) {
      const key =
        marketSnapshotTitleMap[this.utilsService.capitalizeWords(title)];
      if (!key) continue;

      if (key === 'volume') {
        snapshot[key] = value; // or parseVolume(value) if needed
      } else {
        snapshot[key] = this.utilsService.parseNumber(value);
      }
    }

    return snapshot as MarketSnapshot;
  }

  /**
   * Converts parsed { title, value }[] into an object with camelCased keys.
   * Converts numeric values to numbers, leaves others as strings.
   *
   * @param {Array<{ title: string; value: string }>} data
   * @returns {Record<string, string | number>}
   */
  transformParsedData(
    data: { title: string; value: string }[],
  ): Record<string, string | number> {
    return data.reduce(
      (acc, { title, value }) => {
        const key = this.utilsService.toCamelCase(title);
        const parsed = this.utilsService.parseNumber(value);
        acc[key] = isNaN(parsed) ? value : parsed;
        return acc;
      },
      {} as Record<string, string | number>,
    );
  }

  /**
   * Waits for an optional delay, then waits for a selector to appear on the current page.
   *
   * @param selector - The CSS selector to wait for.
   * @param waitMs - Optional delay (in milliseconds) before checking the selector. Default is 100ms.
   * @param options - Options for Puppeteer's waitForSelector (visibility, timeout, etc.).
   * @returns A Promise that resolves to the found ElementHandle or null if not found.
   */
  async waitForSelectorWithDelay(
    selector: string,
    waitMs = 100,
    options: WaitForSelectorOptions = { visible: true, timeout: 60000 },
  ): Promise<ElementHandle<Element> | null> {
    if (waitMs > 0) {
      await this.utilsService.waitSeconds(waitMs);
    }

    return this.page.waitForSelector(selector, options);
  }
}
