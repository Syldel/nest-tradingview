import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';
import { StrategyDataDto } from './dto/strategy-data.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Controller('web-scraper')
export class WebScraperController {
  constructor(private readonly scraperService: WebScraperService) {}

  @UseGuards(ApiKeyGuard)
  @Post('strategy-data')
  async getStrategyData(@Body() params: StrategyDataDto) {
    try {
      const result = await this.scraperService.getStrategyData(params);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
