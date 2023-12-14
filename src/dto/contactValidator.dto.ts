/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ContactQuery {
  @IsNotEmpty()
  public name: string;
  @IsEmail()
  public email: string;
  @IsNotEmpty()
  public phone: string;
}
