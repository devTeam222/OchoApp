import { useToast } from "@/components/ui/use-toast";
import {
  UpdateGroupChatProfileValues,
  UpdateUserProfileValues,
} from "@/lib/validation";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  deleteGroupChatAvatar,
  deleteUserAvatar,
  updateGroupChatProfile,
  updateUserProfile,
} from "./actions";
import {
  ChannelData,
  ChannelsSection,
  LocalUpload,
  PostsPage,
} from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing";
import kyInstance from "@/lib/ky";
import { useSession } from "../../SessionProvider";
import { t } from "@/context/LanguageContext";

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
async function uploadGroupAvatar({
  file,
  channelId,
}: {
  file: File;
  channelId: string;
}): Promise<LocalUpload[] | null> {
  return new Promise<LocalUpload[] | null>(async (resolve) => {
    const formData : FormData = new FormData();
    formData.append("file", file);
    formData.append("id", channelId);

    const response = await kyInstance
      .post("/api/upload/group-chat-avatar", {
        body: formData,
        throwHttpErrors: false,
      })
      .json<LocalUpload[] | null>();

    if (!response?.[0]?.serverData?.avatarUrl) {
      resolve(null);
    }

    return resolve(response);
  });
}


export function useUpdateProfileMutation() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {profileUpdated, profileUpdateError} = t()

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
              description: profileUpdated
          });
      },
      onError: (error) => {
          console.error(error);
          toast({
              variant: "destructive",
              description: profileUpdateError,
          });
      }
  });

  return mutation;
}

export function useDeleteAvatarMutation() {
  const { toast } = useToast();

  const {profilePicDeleted, profilePicDeleteError} = t()

  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteUserAvatar,
    onSuccess: async (updatedUser) => {
      const queryFilter: QueryFilters = {
        queryKey: ["post-feed"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData) return;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.map((post) => {
                if (post.user.id === updatedUser?.id) {
                  return {
                    ...post,
                    user: {
                      ...updatedUser,
                      avatarUrl: null,
                    },
                  };
                }
                return post;
              }),
            })),
          };
        },
      );
      router.refresh();

      toast({
        description: profilePicDeleted,
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        description: profilePicDeleteError,
      });
    },
  });

  return mutation;
}

export function useUpdateGroupChatMutation({
  channelId,
}: {
  channelId: string;
}) {
  const { toast } = useToast();

  const { startUpload: startAvatarUpload } =
    useUploadThing("group-chat-avatar");
  const { user } = useSession();

  const router = useRouter();
  const queryClient = useQueryClient();

  async function upload(file: File) {
    // const uploadResult = null;
    const uploadResult = await uploadGroupAvatar({ file, channelId });

    if (!uploadResult?.[0]) {
      const utUpload = startAvatarUpload([file], { channelId });
      return utUpload;
    }
    return uploadResult;
  }

  const mutation = useMutation({
    mutationFn: async ({
      values,
      avatar,
    }: {
      values: UpdateGroupChatProfileValues;
      avatar?: File;
    }) => {
      return Promise.all([
        updateGroupChatProfile(values),
        avatar ? upload(avatar) : Promise.resolve(undefined),
      ]);
    },
    onSuccess: async ([updatedGroup, uploadResult]) => {
      const newAvatarUrl = uploadResult?.[0]?.serverData.avatarUrl;

      const queryFilter: QueryFilters = {
        queryKey: ["chat", updatedGroup.id],
      };

      const chatListQueryFilter: QueryFilters = {
        queryKey: ["chat-channels", user.id],
      };

      await queryClient.cancelQueries(chatListQueryFilter);
      queryClient.setQueriesData<InfiniteData<ChannelsSection, string | null>>(
        chatListQueryFilter,
        (oldData) => {
          if (!oldData) return;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              channels: page.channels.map((channel) => {
                if (channel.id === updatedGroup?.id) {
                  return {
                    ...channel,
                    name: updatedGroup.name,
                    description: updatedGroup.description,
                    groupAvatarUrl: newAvatarUrl || null,
                  };
                }
                return channel;
              }),
            })),
          };
        },
      );
      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<ChannelData>(queryFilter, (oldData) => {
        if (!oldData) return;
        return {
          ...oldData,
          name: updatedGroup.name,
          description: updatedGroup.description,
          groupAvatarUrl: updatedGroup.groupAvatarUrl,
        };
      });
      router.refresh();

      toast({
        description: "Le groupe a été mis à jour avec succèss",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        description:
          "Une erreur est survenue lors de la mise à jour des paramètres du groupe",
      });
    },
  });

  return mutation;
}
export function useDeleteGroupChatAvatarMutation() {
  const { toast } = useToast();
  const { user } = useSession();

  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteGroupChatAvatar,
    onSuccess: async (updatedGroup) => {
      const queryFilter: QueryFilters = {
        queryKey: ["chat", updatedGroup?.id],
      };

      const chatListQueryFilter: QueryFilters = {
        queryKey: ["chat-channels", user.id],
      };

      await queryClient.cancelQueries(chatListQueryFilter);
      queryClient.setQueriesData<InfiniteData<ChannelsSection, string | null>>(
        chatListQueryFilter,
        (oldData) => {
          if (!oldData) return;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              channels: page.channels.map((channel) => {
                if (channel.id === updatedGroup?.id) {
                  return {
                    ...channel,
                    groupAvatarUrl: null,
                  };
                }
                return channel;
              }),
            })),
          };
        },
      );
      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<ChannelData>(queryFilter, (oldData) => {
        if (!oldData) return;
        return {
          ...oldData,
          groupAvatarUrl: null,
        };
      });
      router.refresh();

      toast({
        description: "Vous venez de supprimer l'icône du groupe.",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        description:
          "Impossible de supprimer l'icône du groupe veuillez réessayer.",
      });
    },
  });

  return mutation;
}
