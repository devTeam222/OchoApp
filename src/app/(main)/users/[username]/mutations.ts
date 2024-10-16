import { useToast } from "@/components/ui/use-toast";
import { UpdateUserProfileValues } from "@/lib/validation";
import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "./actions";
import { LocalUpload, PostsPage } from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing";

async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
    });
    
    const data: Promise<LocalUpload[] | undefined> = response.json();
    if(!data){
        return null
    }
    return data;
}

export function useUpdateProfileMutation() {

    const { toast } = useToast();
    const {startUpload: startAvatarUpload} = useUploadThing("avatar", {
        onClientUploadComplete(res) {
            console.log(res);
        },
    })

    const router = useRouter();
    const queryClient = useQueryClient();

    async function upload(avatar: File) {
        const uploadResult = await uploadAvatar(avatar);
        if(!uploadResult && !uploadResult?.[0]){
            const utUpload = startAvatarUpload([avatar]);
            
            return utUpload
        }
        return uploadResult;
    }

    const mutation = useMutation({
        mutationFn: async ({ values, avatar }: { values: UpdateUserProfileValues, avatar?: File }) => {
            return Promise.all([
                updateUserProfile(values),
                avatar ? upload(avatar) : Promise.resolve(undefined),
            ]);
        },
        onSuccess: async ([updatedUser, uploadResult]) => {
            const newAvatarUrl = uploadResult?.[0].serverData.avatarUrl

            const queryFilter: QueryFilters = {
                queryKey: ["post-feed"]
            }

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
                                            avatarUrl: newAvatarUrl || updatedUser.avatarUrl
                                        }
                                    }
                                }
                                return post
                            })
                        }))
                    }
                }
            );
            router.refresh();

            toast({
                description: "Votre profil a été mis à jour avec succèss"
            })
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
