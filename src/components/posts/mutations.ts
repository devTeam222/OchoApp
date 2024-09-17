import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { deletePost } from "./actions";
import { PostsPage } from "@/lib/types";



export function useDeletePostMutation(){
    const {toast} = useToast();

    const queryClient = useQueryClient();

    const router = useRouter();

    const pathname = usePathname();


    const mutation = useMutation({
        mutationFn: deletePost,
        onSuccess: async (deletedPost) => {
            const queryFilter: QueryFilters = {queryKey: ["post-feed"]}

            await queryClient.cancelQueries(queryFilter)

            queryClient.setQueriesData<InfiniteData<PostsPage, string|null>>(
                queryFilter,
                (oldData)=>{
                    const firstPage = oldData?.pages[0]
                    if (firstPage) {
                        return{
                            pageParams: oldData.pageParams,
                            pages: oldData.pages.map(page=>({
                                nextCursor: page.nextCursor,
                                posts: page.posts.filter(p => p.id !== deletedPost.id)
                            }))
                        }
                    }
                }
            )

            toast({
                description: "Post supprimé"
            })

            if(pathname.startsWith(`/posts/${deletedPost.id}`)){
                router.push(`/users/${deletedPost.user.username}`)
            }
        },
        onError(error) {
            console.error(error);
            toast({
                variant: "destructive",
                description: "Echec de suppression. Veuillez réessayer."
            })
        },
    });

    return mutation;
}