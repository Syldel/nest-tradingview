import { CheerioAPI } from 'cheerio';

export interface StrategyTitleParams {
  strategyTitle: string;
  shortStrategyTitle?: string;
}

export interface GetStrategyDataParams extends StrategyTitleParams {
  $: CheerioAPI;
  attempt?: number;
}
