import { Global, Module } from '@nestjs/common';

import { JsonService } from './json.service';
import { UtilsService } from './utils.service';
import { HttpClientService } from './http-client.service';

@Global()
@Module({
  providers: [JsonService, UtilsService, HttpClientService],
  exports: [JsonService, UtilsService, HttpClientService],
})
export class SharedModule {}
