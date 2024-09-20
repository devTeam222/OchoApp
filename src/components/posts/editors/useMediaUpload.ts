// components/posts/editors/useMediaUpload.ts
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export interface Attachment {
    file: File;
    mediaId?: string;
    isUploading: boolean;
    progress?: number;
}


async function uploadAttachment(file: File, onProgress: (progress: number) => void): Promise<{ mediaId: string }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.open('POST', '/api/upload/attachment', true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                resolve({ mediaId: response.mediaId });
            } else {
                reject(new Error('Failed to upload attachment'));
            }
        };

        xhr.onerror = () => reject(new Error('Failed to upload attachment'));

        xhr.send(formData);
    });
}

export default function useMediaUpload() {
    const MAX_FILE_SIZE_MB = 30; // Limite de taille de fichier en Mo

    const { toast } = useToast();
    const [attachments, setAttachment] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    async function handleStartUpload(files: File[]) {
        setIsUploading(true);
        const newAttachments: Attachment[] = [];

        for (const file of files) {
            // Vérifier la taille du fichier
            const fileSizeMB = file.size / (1024 ** 2);
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                toast({
                    variant: "destructive",
                    description: `Le fichier ${file.name} dépasse la taille maximale de ${MAX_FILE_SIZE_MB} Mo.`,
                });
                continue; // Passer au fichier suivant
            }

            try {
                const attachment = { file, isUploading: true, progress: 0 };
                newAttachments.push(attachment);
                setAttachment(prev => [...prev, attachment]);

                const { mediaId } = await uploadAttachment(file, (progress) => {
                    setAttachment(prev => prev.map(a =>
                        a.file.name === file.name ? { ...a, progress } : a
                    ));
                });

                setAttachment(prev => prev.map(a =>
                    a.file.name === file.name ? { ...a, mediaId, isUploading: false, progress: 100 } : a
                ));
            } catch (error) {
                toast({
                    variant: "destructive",
                    description: (error as Error).message
                });
                setAttachment(prev => prev.map(a =>
                    a.file.name === file.name ? { ...a, isUploading: false, progress: 0 } : a
                ));
            }
        }

        setIsUploading(false);
    }

    function removeAttachment(fileName: string) {
        setAttachment(prev => prev.filter(a => a.file.name !== fileName));
    }

    function reset() {
        setAttachment([]);
        setIsUploading(false);
    }

    return {
        startUpload: handleStartUpload,
        attachments,
        isUploading,
        removeAttachment,
        reset
    };
}
