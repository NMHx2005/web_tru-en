import { apiClient } from './client';

export interface Notification {
    id: string;
    title: string;
    content: string;
    type: 'SYSTEM_UPDATE' | 'MAINTENANCE' | 'NEW_FEATURE' | 'ANNOUNCEMENT' | 'WARNING' | 'INFO';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    targetRole?: 'USER' | 'AUTHOR' | 'ADMIN';
    sendEmail: boolean;
    isActive: boolean;
    createdById: string;
    createdBy?: {
        id: string;
        username: string;
        displayName?: string;
    };
    createdAt: string;
    updatedAt: string;
    recipientCount?: number;
    recipientId?: string;
    isRead?: boolean;
    readAt?: string;
}

export interface CreateNotificationRequest {
    title: string;
    content: string;
    type: Notification['type'];
    priority?: Notification['priority'];
    targetRole?: Notification['targetRole'];
    sendEmail?: boolean;
}

export interface UpdateNotificationRequest {
    title?: string;
    content?: string;
    type?: Notification['type'];
    priority?: Notification['priority'];
    isActive?: boolean;
}

export const notificationsService = {
    // Admin endpoints
    create: async (data: CreateNotificationRequest) => {
        const response = await apiClient.post('/notifications', data);
        return response.data;
    },

    getAll: async (params?: {
        page?: number;
        limit?: number;
        type?: string;
        priority?: string;
        isActive?: boolean;
    }) => {
        const response = await apiClient.get('/notifications/admin/all', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get(`/notifications/admin/${id}`);
        return response.data;
    },

    update: async (id: string, data: UpdateNotificationRequest) => {
        const response = await apiClient.patch(`/notifications/admin/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete(`/notifications/admin/${id}`);
        return response.data;
    },

    // User endpoints
    getMyNotifications: async (params?: {
        page?: number;
        limit?: number;
        isRead?: boolean;
    }) => {
        const response = await apiClient.get('/notifications/my', { params });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (recipientId: string) => {
        const response = await apiClient.post(`/notifications/${recipientId}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await apiClient.post('/notifications/mark-all-read');
        return response.data;
    },
};
