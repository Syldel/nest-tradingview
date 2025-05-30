import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CookieDocument = Cookie & Document;

@Schema()
export class Cookie {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  domain?: string;

  @Prop()
  path?: string;

  @Prop()
  secure?: boolean;

  @Prop()
  httpOnly?: boolean;

  @Prop()
  session?: boolean;

  @Prop()
  expirationDate?: Date;
}

export const CookieSchema = SchemaFactory.createForClass(Cookie);
