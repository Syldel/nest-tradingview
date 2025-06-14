import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  HttpCode,
} from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';
import { StrategyDataDto } from './dto/strategy-data.dto';

@Controller('web-scraper')
export class WebScraperController {
  constructor(private readonly scraperService: WebScraperService) {}

  @Post('load-page')
  @HttpCode(200)
  async loadWebPage(): Promise<void> {
    try {
      await this.scraperService.loadWebPage();
    } catch (error) {
      console.error('❌ Error loading page:', error);
      throw new InternalServerErrorException('Failed to load web page');
    }
  }

  @Post('strategy-data')
  async getStrategyData(@Body() params: StrategyDataDto) {
    try {
      return this.scraperService.getStrategyData(params);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
