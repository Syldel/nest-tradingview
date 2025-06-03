import { CheerioAPI } from 'cheerio';

export interface GetStrategyDataParams {
  strategyTitle: string;
  $: CheerioAPI;
  shortStrategyTitle?: string;
  attempt?: number;
}
