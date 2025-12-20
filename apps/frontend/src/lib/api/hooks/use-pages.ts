import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesService, Page, CreatePageRequest, UpdatePageRequest } from '../pages.service';

export const usePages = () => {
    return useQuery({
        queryKey: ['pages'],
        queryFn: () => pagesService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const usePage = (slug: string) => {
    return useQuery({
        queryKey: ['page', slug],
        queryFn: () => pagesService.getBySlug(slug),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreatePage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePageRequest) => pagesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
        },
    });
};

export const useUpdatePage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: UpdatePageRequest }) =>
            pagesService.update(slug, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            queryClient.invalidateQueries({ queryKey: ['page', variables.slug] });
        },
    });
};

export const useDeletePage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (slug: string) => pagesService.delete(slug),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
        },
    });
};

