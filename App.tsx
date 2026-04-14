import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { Upload, FileText, Download, Plus, PenTool } from 'lucide-react';
import { PhotoItem } from './types';
import { SortablePhoto } from './components/SortablePhoto';
import { generateDocxReport } from './services/docxGenerator';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [docTitle, setDocTitle] = useState("FOTODOKUMENTÁCIA Z NÁŠHO MIESTNEHO ŠETRENIA, ZO DŇA");
  const [isDragOver, setIsDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Shared helper — converts File[] to PhotoItem[] and appends them
  const addFiles = (files: File[]) => {
    const allowed = files.filter(f => f.type === 'image/jpeg' || f.type === 'image/png');
    if (allowed.length === 0) return;
    const newItems: PhotoItem[] = allowed.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
    }));
    setPhotos((prev) => [...prev, ...newItems]);
  };

  // Handle File Upload (input)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(Array.from(event.target.files));
    event.target.value = '';
  };

  // Handle Drop from OS file manager
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  // Handle Drag End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      // Clean up object URL to prevent memory leaks
      const removed = prev.find(p => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  };

  const handleCaptionChange = (id: string, newCaption: string) => {
    setPhotos((prev) => 
      prev.map((p) => (p.id === id ? { ...p, caption: newCaption } : p))
    );
  };

  const handleDownload = async () => {
    if (photos.length === 0) return;
    setIsGenerating(true);
    try {
      await generateDocxReport(photos, docTitle);
    } catch (e) {
      console.error(e);
      alert("Nastala chyba pri generovaní dokumentu.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-accent h-6 w-6" />
            <h1 className="text-xl font-bold text-gray-900">LAPA SLOVAKIA s. r. o. - fotodokumentácia</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-500 hidden sm:inline-block">
               {photos.length} {photos.length === 1 ? 'fotografia' : (photos.length >= 2 && photos.length <= 4 ? 'fotografie' : 'fotografií')}
             </span>
            <button
              onClick={handleDownload}
              disabled={photos.length === 0 || isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors ${
                photos.length === 0 || isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-accent hover:bg-sky-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isGenerating ? 'Generujem...' : 'Stiahnuť DOCX'}
              {!isGenerating && <Download size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Zone */}
        {photos.length === 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`bg-white border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragOver ? 'border-accent bg-blue-50' : 'border-gray-300 hover:border-accent'}`}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <Upload className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nahrajte fotografie</h3>
            <p className="mt-1 text-sm text-gray-500">Drag & drop alebo kliknite pre výber</p>
            <div className="mt-6">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-accent hover:bg-sky-700">
                Vybrať súbory
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Document Settings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <label htmlFor="docTitle" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <PenTool size={16} />
                Nadpis dokumentu (prvý riadok vo Worde)
              </label>
              <input
                id="docTitle"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-gray-900 bg-white"
                placeholder="Zadajte nadpis dokumentu..."
              />
            </div>

             {/* Toolbar */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex justify-end items-center p-4 rounded-lg border transition-colors ${isDragOver ? 'bg-blue-100 border-accent border-2' : 'bg-blue-50 border-blue-100'}`}
            >
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-blue-200 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50">
                <Plus size={16} />
                Pridať ďalšie
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Grid */}
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={photos.map(p => p.id)} 
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((photo, index) => (
                    <SortablePhoto
                      key={photo.id}
                      photo={photo}
                      index={index}
                      onRemove={handleRemovePhoto}
                      onCaptionChange={handleCaptionChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </main>
    </div>
  );
}