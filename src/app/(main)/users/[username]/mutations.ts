import { useToast } from "@/components/ui/use-toast";
import { UpdateUserProfileValues } from "@/lib/validation";
import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "./actions";
import { PostsPage } from "@/lib/types";

async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to upload avatar');
    }

    const data = await response.json();
    return data.fileUrl;
}

export function useUpdateProfileMutation() {
    const { toast } = useToast();
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ values, avatar }: { values: UpdateUserProfileValues, avatar?: File }) => {
            const [updatedUser, avatarUrl] = await Promise.all([
                updateUserProfile({
                    ...values,
                    avatarUrl: avatar ? await uploadAvatar(avatar) : undefined
                }),
                avatar ? uploadAvatar(avatar) : Promise.resolve(undefined),
            ]);

            return { updatedUser, avatarUrl };
        },
        onSuccess: async ({ updatedUser, avatarUrl }) => {
            const newAvatarUrl = avatarUrl ?? updatedUser.avatarUrl;

            const queryFilter: QueryFilters = {
                queryKey: ["post-feed"]
            };

            await queryClient.cancelQueries(queryFilter);

            queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
                queryFilter,
                (oldData) => {
                    if (!oldData) return;
                    return {
                        pageParams: oldData.pageParams,
                        pages: oldData.pages.map(page => ({
                            nextCursor: page.nextCursor,
                            posts: page.posts.map(post => {
                                if (post.user.id === updatedUser.id) {
                                    return {
                                        ...post,
                                        user: {
                                            ...updatedUser,
                                            avatarUrl: newAvatarUrl
                                        }
                                    };
                                }
                                return post;
                            })
                        }))
                    };
                }
            );
            router.refresh();

            toast({
                description: "Votre profil a été mis à jour avec succès"
            });
        },
        onError: (error) => {
            console.error(error);
            toast({
                variant: "destructive",
                description: "Une erreur est survenue lors de la mise à jour de votre profil",
            });
        }
    });

    return mutation;
}
