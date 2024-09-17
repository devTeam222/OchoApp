import kyInstance from "./ky";


// Créer un canal de discussion
export async function createChatChannel(userId: string, recipientId: string) {
    return kyInstance
        .post("/api/chat-channels", {
            json: {
                userId,
                recipientId,
                isGroup: false,
            },
        })
        .json();
}

// Créer un canal de discussion de groupe
export async function createGroupChatChannel(userId: string, name: string, members: string[]) {
    return kyInstance
        .post("/api/chat-channels", {
            json: {
                userId,
                name,
                isGroup: true,
                members,
            },
        })
        .json();
}


// Envoyer un message
export async function sendMessage(content: string, channelId: string, senderId: string) {
    return kyInstance
        .post("/api/messages", {
            json: {
                content,
                channelId,
                senderId,
            },
        })
        .json();
}

// Récupérer les messages d'un canal
export async function getMessages(channelId: string) {
    return kyInstance
        .get(`/api/messages?channelId=${channelId}`)
        .json();
}