import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, Settings, UpdateSettingsRequest } from '../settings.service';

export const useSettings = () => {
    return useQuery({
        queryKey: ['settings'],
        queryFn: () => settingsService.get(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateSettingsRequest) => settingsService.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
    });
};

export const useUploadLogo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadLogo(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
    });
};

export const useUploadFavicon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => settingsService.uploadFavicon(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
    });
};
