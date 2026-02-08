'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface Card {
    id: string;
    filename: string;
    imageUrl: string;
    createdAt: string;
}

export default function CardsPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const res = await fetch('/api/admin/cards');
            const data = await res.json();
            if (data.success) {
                setCards(data.cards);
            }
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const res = await fetch('/api/admin/cards', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                setCards([...data.cards, ...cards]);
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (cardId: string) => {
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            const res = await fetch(`/api/admin/cards/${cardId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                setCards(cards.filter((c) => c.id !== cardId));
            }
        } catch (error) {
            console.error('Failed to delete card:', error);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleUpload(e.dataTransfer.files);
    }, []);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Card Management</h1>
                    <p className="text-slate-400 text-sm mt-1">{cards.length} cards uploaded</p>
                </div>
            </div>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`glass rounded-xl p-6 md:p-8 mb-6 border-2 border-dashed transition-colors ${dragActive
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dream-border hover:border-primary-500/50'
                    }`}
            >
                <div className="text-center">
                    <div className="text-4xl md:text-5xl mb-4">🎴</div>
                    <h2 className="text-lg font-semibold text-white mb-2">
                        {uploading ? 'Uploading...' : 'Upload Card Images'}
                    </h2>
                    <p className="text-slate-400 text-sm mb-4">
                        Drag and drop images here, or click to select
                    </p>
                    <label className="btn btn-primary px-6 py-3 cursor-pointer inline-block">
                        {uploading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            'Select Files'
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleUpload(e.target.files)}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                    <p className="text-slate-500 text-xs mt-3">
                        Supports: JPG, PNG, WebP (Max 5MB each)
                    </p>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="glass rounded-xl p-4 md:p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Card Gallery</h2>

                {loading ? (
                    <div className="py-8 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                        No cards uploaded yet. Upload some images to get started!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {cards.map((card) => (
                            <div key={card.id} className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-dream-surface">
                                <Image
                                    src={card.imageUrl}
                                    alt={card.filename}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                    className="object-cover"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        className="btn bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
