import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { uploadFile } from "@/lib/fileUtils";

export interface Attachment {
    file: File;
    mediaId?: string;
    isUploading: boolean;
}

export default function useMediaUpload() {
    const { toast } = useToast();
    const [attachments, setAttachment] = useState<Attachment[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>();

    async function handleStartUpload(files: File[]) {
        if (attachments.length + files.length > 5) {
            toast({
                variant: "destructive",
                description: "Vous ne pouvez pas téléverser plus de 5 pièces jointes à la fois."
            });
            return;
        }

        setAttachment(prev => [
            ...prev,
            ...files.map(file => ({ file, isUploading: true }))
        ]);

        try {
            const results = await Promise.all(files.map(file => uploadFile(file)));
            setAttachment(prev => prev.map(a => {
                const result = results.find((r: { fileName: string; }) => r.fileName === a.file.name);
                if (!result) return a;
                return {
                    ...a,
                    mediaId: result.mediaId,
                    isUploading: false
                };
            }));
        } catch (e) {
            setAttachment(prev => prev.filter(a => a.isUploading));
            console.error((e as Error).message);
            toast({
                variant: "destructive",
                description: "Une erreur est survenue lors du téléversement de la pièce jointe."
            });
        }
    }

    function removeAttachment(fileName: string) {
        setAttachment(prev => prev.filter(a => a.file.name !== fileName));
    }

    function reset() {
        setAttachment([]);
        setUploadProgress(undefined);
    }

    return {
        startUpload: handleStartUpload,
        attachments,
        uploadProgress,
        removeAttachment,
        reset
    }
};
