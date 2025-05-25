
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image } from "lucide-react";

interface ShopLogoUploadProps {
  shopId: string;
  currentLogoUrl?: string;
  onLogoUpdate: (logoUrl: string | null) => void;
  disabled?: boolean;
}

export const ShopLogoUpload = ({ shopId, currentLogoUrl, onLogoUpdate, disabled }: ShopLogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/logo.${fileExt}`;

      // Remove existing logo if any
      if (currentLogoUrl) {
        const existingPath = currentLogoUrl.split('/').pop();
        if (existingPath) {
          await supabase.storage.from('shop-logos').remove([`${shopId}/${existingPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
      
      // Update shop record
      const { error: updateError } = await supabase
        .from('shops')
        .update({ logo_url: data.publicUrl })
        .eq('id', shopId);

      if (updateError) {
        throw updateError;
      }

      onLogoUpdate(data.publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeLogo = async () => {
    try {
      setRemoving(true);

      if (currentLogoUrl) {
        const fileName = currentLogoUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('shop-logos').remove([`${shopId}/${fileName}`]);
        }
      }

      const { error } = await supabase
        .from('shops')
        .update({ logo_url: null })
        .eq('id', shopId);

      if (error) {
        throw error;
      }

      onLogoUpdate(null);
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    } finally {
      setRemoving(false);
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Shop Logo</label>
      
      {currentLogoUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <img 
              src={currentLogoUrl} 
              alt="Shop logo" 
              className="w-16 h-16 object-cover rounded border"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={removeLogo}
                disabled={disabled || removing}
              >
                <X className="h-4 w-4 mr-1" />
                {removing ? 'Removing...' : 'Remove Logo'}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Upload new logo to replace current one:
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              disabled={disabled || uploading}
              className="cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
            <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No logo uploaded</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Choose logo file:
            </label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={uploadLogo}
                disabled={disabled || uploading}
                className="cursor-pointer flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={triggerFileInput}
                disabled={disabled || uploading}
              >
                <Upload className="h-4 w-4 mr-1" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Max file size: 5MB. Supported formats: JPG, PNG, WebP, GIF
      </p>
    </div>
  );
};
