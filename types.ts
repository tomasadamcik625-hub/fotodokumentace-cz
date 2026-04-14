export interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
}

export interface SortablePhotoCardProps {
  photo: PhotoItem;
  index: number;
  onRemove: (id: string) => void;
  onCaptionChange: (id: string, newCaption: string) => void;
}
