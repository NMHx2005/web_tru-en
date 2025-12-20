import { IsEmail, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
