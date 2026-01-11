import { IsString, IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { NotificationType, NotificationPriority, UserRole } from '@prisma/client';

export class CreateNotificationDto {
    @IsString()
    @MinLength(1)
    title: string;

    @IsString()
    @MinLength(1)
    content: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsEnum(NotificationPriority)
    @IsOptional()
    priority?: NotificationPriority;

    @IsEnum(UserRole)
    @IsOptional()
    targetRole?: UserRole; // null = all users

    @IsBoolean()
    @IsOptional()
    sendEmail?: boolean;
}
