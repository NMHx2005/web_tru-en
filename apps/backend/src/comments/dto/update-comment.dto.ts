import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Comment không được vượt quá 5000 ký tự' })
  content: string;
}

