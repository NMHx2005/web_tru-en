import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService, CreateNotificationRequest, UpdateNotificationRequest } from '../notifications.service';

export const useNotifications = (params?: {
    page?: number;
    limit?: number;
    type?: string;
    priority?: string;
    isActive?: boolean;
}) => {
    return useQuery({
        queryKey: ['notifications', 'admin', params],
        queryFn: () => notificationsService.getAll(params),
    });
};

export const useNotification = (id: string) => {
    return useQuery({
        queryKey: ['notifications', id],
        queryFn: () => notificationsService.getById(id),
        enabled: !!id,
    });
};

export const useCreateNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateNotificationRequest) => notificationsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useUpdateNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateNotificationRequest }) =>
            notificationsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

// User hooks
export const useMyNotifications = (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
}) => {
    return useQuery({
        queryKey: ['notifications', 'my', params],
        queryFn: () => notificationsService.getMyNotifications(params),
    });
};

export const useUnreadCount = () => {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationsService.getUnreadCount(),
        refetchInterval: 30000, // Refetch every 30 seconds
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (recipientId: string) => notificationsService.markAsRead(recipientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationsService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
