import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebScraperModule } from './web-scraper/web-scraper.module';
import { SharedModule } from '@services/shared.module';
import { CookiesModule } from './cookies/cookies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    CookiesModule,
    SharedModule,
    WebScraperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
