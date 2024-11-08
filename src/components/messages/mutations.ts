import { useToast } from "@/components/ui/use-toast";
import {
  InfiniteData,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addAdmin,
  addMembers,
  banMember,
  createChatChannel,
  deleteMessage,
  leaveGroup,
  removeMember,
  restoreMember,
  saveMessage,
  submitMessage,
} from "./actions";
import { ChannelsSection, MessageData, MessagesSection } from "@/lib/types";

export function useSubmitMessageMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitMessage,
    onSuccess: async ({ newMessage, channelId, newChannel, userId }) => {
      const isSavedMessage = channelId === `saved-${userId}`;
      newMessage.type = "CONTENT";
      const messageQueryKey = isSavedMessage
        ? ["messages", `saved-${userId}`]
        : ["messages", channelId];
      const channelQueryKey = ["chat-channels", userId];

      // 1. Update the message cache
      const cachedMessages =
        queryClient.getQueryData<InfiniteData<MessagesSection, string | null>>(
          messageQueryKey,
        );

      const messageExists = cachedMessages?.pages.some((page) =>
        page.messages.some((message) => message.id === newMessage.id),
      );
      if (!messageExists) {
        queryClient.setQueryData<InfiniteData<MessagesSection, string | null>>(
          messageQueryKey,
          (oldData) => {
            if (!oldData) return;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                messages: [newMessage, ...page.messages],
              })),
              pageParams: oldData.pageParams,
            };
          },
        );
      }

      // 2. Update the channel cache if not a saved message
      if (!isSavedMessage) {
        const cachedChannels =
          queryClient.getQueryData<
            InfiniteData<ChannelsSection, string | null>
          >(channelQueryKey);

        const channelIndex = cachedChannels?.pages
          .flatMap((page, pageIndex) =>
            page.channels.map((channel, index) => ({
              channel,
              pageIndex,
              index,
            })),
          )
          .find(({ channel }) => channel.id === channelId);

        if (channelIndex) {
          // Move the existing channel to the beginning
          queryClient.setQueryData<
            InfiniteData<ChannelsSection, string | null>
          >(channelQueryKey, (oldData) => {
            if (!oldData) return;

            const { pageIndex, index } = channelIndex;
            const channel = oldData.pages[pageIndex].channels[index];

            return {
              ...oldData,
              pages: oldData.pages.map((page, idx) => {
                if (idx === 0) {
                  return {
                    ...page,
                    channels: [
                      {
                        ...channel,
                        messages: [newMessage],
                      },
                      ...page.channels.filter((ch) => ch.id !== channel.id),
                    ],
                  };
                }
                if (idx === pageIndex) {
                  return {
                    ...page,
                    channels: page.channels.filter(
                      (ch) => ch.id !== channel.id,
                    ),
                  };
                }
                return page;
              }),
              pageParams: oldData.pageParams,
            };
          });
        } else if (newChannel) {
          // Add the new channel
          queryClient.setQueryData<
            InfiniteData<ChannelsSection, string | null>
          >(channelQueryKey, (oldData) => {
            if (!oldData) return;
            return {
              ...oldData,
              pages: oldData.pages.map((page, idx) => {
                if (idx === 0) {
                  return {
                    ...page,
                    channels: [newChannel, ...page.channels],
                  };
                }
                return page;
              }),
              pageParams: oldData.pageParams,
            };
          });
        }
      }
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Impossible d'envoyer ce message. Veuillez réessayer.",
      });
    },
  });

  return mutation;
}

export function useSaveMessageMutation() {
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveMessage,
    onSuccess: async ({ newChannel, userId }) => {
      const queryKey = ["chat-channels", userId];
      await queryClient.invalidateQueries({ queryKey });
      toast({
        description: "Vous pouvez maintenent discuter",
      });
      return newChannel;
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est n'a pas marché. Veuillez réessayer",
      });
    },
  });
  return mutation;
}

export function useDeleteMessageMutation() {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const mutation = useMutation({
      mutationFn: deleteMessage,
      onSuccess: async (deletedMessage) => {
          const queryKey: QueryKey = ["messages", deletedMessage.channelId];

          const readsKey: QueryKey = ["reads-info", deletedMessage.id];

          await queryClient.cancelQueries({ queryKey:readsKey });
          await queryClient.invalidateQueries({ queryKey });
      },
      onError(error) {
          console.error(error);
          toast({
              variant: "destructive",
              description: "Echec de suppression. Veuillez réessayer."
          })
      },
  })

  return mutation;
}

export function useCreateChatChannelMutation() {
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createChatChannel,
    onSuccess: async ({ newChannel, userId }) => {
      const queryKey = ["chat-channels", userId];
      await queryClient.invalidateQueries({ queryKey });

      toast({
        description: "Vous pouvez maintenent discuter",
      });
      return newChannel;
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est mal passé. Veuillez réessayer",
      });
    },
  });
  return mutation;
}
export function useAddMemberMutation() {
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addMembers,
    onSuccess: async ({ newMembersList, userId }) => {
      const queryKey = ["chat-channels", userId];
      // Vérifier si createInfo est défini avant de l'assigner à newMessage
      if (!newMembersList.length) {
        toast({
          variant: "destructive",
          description:
            "Vous ne pouvez pas ajouter de nouveaux membres à ce groupe",
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey });

      toast({
        description: "Les utilisateurs selectionnes ont bien été ajoutés",
      });
      return { newMembersList };
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est mal passé. Veuillez réessayer",
      });
    },
  });
  return mutation;
}
export function useAddAdminMutation() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: addAdmin,
    onSuccess: ({ newChannelMember }) => {
      return { newChannelMember };
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est mal passé. Veuillez réessayer",
      });
    },
  });
  return mutation;
}
export function useRemoveMemberMutation() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: removeMember,
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est mal passé. Veuillez réessayer",
      });
    },
  });
  return mutation;
}
export function useBanMemberMutation() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: banMember,
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est mal passé. Veuillez réessayer",
      });
    },
  });
  return mutation;
}
export function useRestoreMemberMutation() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: restoreMember,
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est mal passé. Veuillez réessayer",
      });
    },
  });
  return mutation;
}

export function useLeaveGroupMutation() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: leaveGroup,
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Quelque chose s'est mal passé. Veuillez réessayer",
      });
    },
  });
  return mutation;
}