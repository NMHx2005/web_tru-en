import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Comment không được vượt quá 5000 ký tự' })
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

