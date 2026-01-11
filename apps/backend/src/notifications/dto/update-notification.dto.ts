import { IsString, IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { NotificationType, NotificationPriority } from '@prisma/client';

export class UpdateNotificationDto {
    @IsString()
    @MinLength(1)
    @IsOptional()
    title?: string;

    @IsString()
    @MinLength(1)
    @IsOptional()
    content?: string;

    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;

    @IsEnum(NotificationPriority)
    @IsOptional()
    priority?: NotificationPriority;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
