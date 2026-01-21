
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  username: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  avatar_url: string;
  
  @Prop()
  full_name: string;

  @Prop()
  bio: string;

  @Prop()
  phone: string;
  
  @Prop()
  gender: string;

  @Prop()
  birthdate: Date;

  @Prop()
  status: string;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;

  @Prop()
  last_login: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);