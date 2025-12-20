import { apiClient } from './client';
import { ApiResponse } from './client';

export interface Settings {
    id: string;
    siteName: string;
    siteDescription?: string;
    siteLogo?: string;
    siteFavicon?: string;
    siteEmail?: string;
    sitePhone?: string;
    siteAddress?: string;
    siteFacebook?: string;
    siteTwitter?: string;
    siteYoutube?: string;
    siteInstagram?: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateSettingsRequest {
    siteName?: string;
    siteDescription?: string;
    siteLogo?: string;
    siteFavicon?: string;
    siteEmail?: string;
    sitePhone?: string;
    siteAddress?: string;
    siteFacebook?: string;
    siteTwitter?: string;
    siteYoutube?: string;
    siteInstagram?: string;
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    allowRegistration?: boolean;
    requireEmailVerification?: boolean;
}

export const settingsService = {
    get: async (): Promise<Settings> => {
        const response = await apiClient.get<ApiResponse<Settings>>('/settings');
        return response.data.data || response.data;
    },

    update: async (data: UpdateSettingsRequest): Promise<Settings> => {
        const response = await apiClient.patch<ApiResponse<Settings>>('/settings', data);
        return response.data.data || response.data;
    },

    uploadLogo: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<ApiResponse<{ url: string }>>(
            '/settings/upload-logo',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data.data?.url || '';
    },

    uploadFavicon: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<ApiResponse<{ url: string }>>(
            '/settings/upload-favicon',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data.data?.url || '';
    },
};
