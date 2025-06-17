import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
} from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';
import { StrategyDataDto } from './dto/strategy-data.dto';

@Controller('web-scraper')
export class WebScraperController {
  constructor(private readonly scraperService: WebScraperService) {}

  @Post('strategy-data')
  async getStrategyData(@Body() params: StrategyDataDto) {
    try {
      return this.scraperService.getStrategyData(params);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
