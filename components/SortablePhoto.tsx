import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Image as ImageIcon } from 'lucide-react';
import { SortablePhotoCardProps } from '../types';

export const SortablePhoto: React.FC<SortablePhotoCardProps> = ({ 
  photo, 
  index, 
  onRemove, 
  onCaptionChange 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
    >
      {/* Drag Handle & Header */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-100">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <GripVertical size={20} />
        </div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Foto {index + 1}
        </span>
        <button
          onClick={() => onRemove(photo.id)}
          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
          title="Odstranit fotku"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image Preview */}
      <div className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {photo.previewUrl ? (
          <img
            src={photo.previewUrl}
            alt="Preview"
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
            className="w-full h-full object-contain"
          />
        ) : (
          <ImageIcon className="text-gray-300" size={48} />
        )}
      </div>

      {/* Caption Input */}
      <div className="p-3 bg-white">
        <label htmlFor={`caption-${photo.id}`} className="sr-only">Popis fotky</label>
        <textarea
          id={`caption-${photo.id}`}
          value={photo.caption}
          onChange={(e) => onCaptionChange(photo.id, e.target.value)}
          placeholder="Zadejte popis fotky..."
          rows={2}
          className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none font-sans bg-white text-gray-900"
        />
        <div className="mt-1 flex justify-between items-center text-xs text-gray-400">
           <span>16x12,01cm | 12pt</span>
           <span>{(index + 1) % 2 === 0 ? "Konec stránky" : ""}</span>
        </div>
      </div>
    </div>
  );
};