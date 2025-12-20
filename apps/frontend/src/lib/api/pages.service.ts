import { apiClient } from './client';
import { ApiResponse } from './client';

export interface Page {
    id: string;
    slug: string;
    title: string;
    content: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePageRequest {
    slug: string;
    title: string;
    content: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdatePageRequest {
    title?: string;
    content?: string;
    description?: string;
    isActive?: boolean;
}

export const pagesService = {
    getAll: async (): Promise<Page[]> => {
        const response = await apiClient.get<ApiResponse<Page[]>>('/pages');
        return response.data.data || response.data || [];
    },

    getBySlug: async (slug: string): Promise<Page> => {
        const response = await apiClient.get<ApiResponse<Page>>(`/pages/${slug}`);
        return response.data.data || response.data;
    },

    create: async (data: CreatePageRequest): Promise<Page> => {
        const response = await apiClient.post<ApiResponse<Page>>('/pages', data);
        return response.data.data || response.data;
    },

    update: async (slug: string, data: UpdatePageRequest): Promise<Page> => {
        const response = await apiClient.patch<ApiResponse<Page>>(`/pages/${slug}`, data);
        return response.data.data || response.data;
    },

    delete: async (slug: string): Promise<void> => {
        await apiClient.delete(`/pages/${slug}`);
    },
};

