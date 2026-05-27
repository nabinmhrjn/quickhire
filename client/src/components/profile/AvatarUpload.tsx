import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  currentUrl: string | null;
  name: string;
  onUpload: (url: string) => void;
}

export function AvatarUpload({ currentUrl, name, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { url } = res.data;
      setPreview(url);
      onUpload(url);
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <Avatar className="h-20 w-20">
        <AvatarImage src={preview ?? ""} />
        <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <Button type="button" size="icon" variant="secondary"
        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow"
        onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </Button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
