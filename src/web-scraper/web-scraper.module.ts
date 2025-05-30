import { Module } from '@nestjs/common';

import { WebScraperService } from './web-scraper.service';
import { WebScraperController } from './web-scraper.controller';
import { CookiesModule } from '../cookies/cookies.module';

@Module({
  imports: [CookiesModule],
  providers: [WebScraperService],
  controllers: [WebScraperController],
  exports: [WebScraperService],
})
export class WebScraperModule {}
