import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Cookie, CookieDocument } from './cookie.schema';
import { Model } from 'mongoose';

@Injectable()
export class CookiesService {
  constructor(
    @InjectModel(Cookie.name)
    private readonly cookieModel: Model<CookieDocument>,
  ) {}

  async findAll(): Promise<Cookie[]> {
    return this.cookieModel.find().exec();
  }

  async findByName(name: string): Promise<Cookie | null> {
    return this.cookieModel.findOne({ name }).exec();
  }

  async getCookieMap(): Promise<Record<string, string>> {
    const cookies = await this.findAll();
    const cookieMap: Record<string, string> = {};

    for (const cookie of cookies) {
      cookieMap[cookie.name] = cookie.value;
    }

    return cookieMap;
  }
}
