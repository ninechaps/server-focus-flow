'use client';
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';

interface AvatarUploadProps {
  avatarUrl: string | null;
  initials: string;
  onUpdated: (newUrl: string | null) => void;
}

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB，上传前校验
const MAX_DIMENSION = 400;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // 尺寸已在限制内：直接读原始文件，不走 canvas，零质量损耗
      if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
        resolve(readAsDataUrl(file));
        return;
      }

      // 需要缩放：高质量 WebP，比 JPEG 更清晰且体积更小
      const ratio = Math.min(
        MAX_DIMENSION / img.width,
        MAX_DIMENSION / img.height
      );
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/webp', 0.92));
    };

    img.onerror = reject;
    img.src = objectUrl;
  });
}

export function AvatarUpload({
  avatarUrl,
  initials,
  onUpdated
}: AvatarUploadProps) {
  const t = useTranslations('profile.avatarUpload');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImageFile'));
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error(t('imageTooLarge'));
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await processImage(file);
      setPreview(dataUrl);

      const res = await apiClient('/api/auth/me/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: dataUrl })
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? t('updateFailed'));
        setPreview(null);
        return;
      }

      onUpdated(dataUrl);
      toast.success(t('updateSuccess'));
    } catch {
      toast.error(t('uploadFailed'));
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div
      className='group relative w-fit cursor-pointer'
      onClick={() => inputRef.current?.click()}
    >
      <Avatar className='h-20 w-20'>
        <AvatarImage
          src={preview ?? avatarUrl ?? undefined}
          className='object-cover'
        />
        <AvatarFallback className='text-xl'>{initials}</AvatarFallback>
      </Avatar>
      <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
        <span className='text-xs font-medium text-white'>
          {uploading ? '...' : t('edit')}
        </span>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
}
