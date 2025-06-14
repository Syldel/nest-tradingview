import { IsString, IsOptional } from 'class-validator';

import { ChartInterval } from '../../types/chart.type';

export class StrategyDataDto {
  @IsString()
  symbol: string;

  @IsString()
  exchange: string;

  @IsString()
  interval: ChartInterval;

  @IsString()
  strategyTitle: string;

  @IsOptional()
  @IsString()
  shortStrategyTitle?: string;
}
