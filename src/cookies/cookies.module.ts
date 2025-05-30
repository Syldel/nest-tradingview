import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Cookie, CookieSchema } from './cookie.schema';
import { CookiesService } from './cookies.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cookie.name, schema: CookieSchema }]),
  ],
  providers: [CookiesService],
  exports: [CookiesService],
})
export class CookiesModule {}
