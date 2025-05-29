import { Module } from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';
import { WebScraperController } from './web-scraper.controller';

@Module({
  providers: [WebScraperService],
  controllers: [WebScraperController],
  exports: [WebScraperService],
})
export class WebScraperModule {}
