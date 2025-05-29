import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';

@Controller('web-scraper')
export class WebScraperController {
  constructor(private readonly scraperService: WebScraperService) {}

  @Get('scrape')
  async scrape(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('Missing url parameter');
    }
    return this.scraperService.scrape(url);
  }
}
