import { IsEnum } from 'class-validator';
import { CommentModerationAction } from './admin-comment-query.dto';

export class ModerateCommentDto {
  @IsEnum(CommentModerationAction)
  action: CommentModerationAction;
}

