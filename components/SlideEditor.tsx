import React, { useMemo, useState, useCallback } from 'react';
import { SlideContent, Template } from '../types';
import { GoogleGenAI } from '@google/genai';

declare const PptxGenJS: any;

interface SlideEditorProps {
    slides: SlideContent[] | null;
    setSlides: React.Dispatch<React.SetStateAction<SlideContent[] | null>>;
    templates: Record<string, Template>;
}

const autoResizeTextarea = (element: HTMLTextAreaElement | null) => {
    if (element) {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    }
};

interface EditableSlideCardProps {
    slide: SlideContent;
    index: number;
    totalSlides: number;
    availableSlideTemplates: string[];
    generatingImageIds: Set<string>;
    onSlideChange: (id: string, field: keyof Omit<SlideContent, 'id'>, value: any) => void;
    onBulletChange: (slideId: string, bulletIndex: number, value: string) => void;
    onAddBullet: (slideId: string, bulletIndex: number) => void;
    onRemoveBullet: (slideId: string, bulletIndex: number) => void;
    onMoveSlide: (index: number, direction: 'up' | 'down') => void;
    onDeleteSlide: (id: string) => void;
    onGenerateImage: (id: string) => void;
}

const EditableSlideCard = React.memo(({
    slide, index, totalSlides, availableSlideTemplates, generatingImageIds,
    onSlideChange, onBulletChange, onAddBullet, onRemoveBullet, onMoveSlide, onDeleteSlide, onGenerateImage
}: EditableSlideCardProps) => {
    return (
        <div className="slide-card editable">
            {generatingImageIds.has(slide.id) ? (
                <div className="image-loading-placeholder">
                    <div className="loading-spinner"></div>
                    <p>Generating Image...</p>
                </div>
            ) : slide.imageUrl ? (
                <div className="slide-image-container">
                    <img src={slide.imageUrl} alt={`Generated image for ${slide.title}`} className="slide-image" />
                </div>
            ) : null }
            <div className="slide-card-header">
                <textarea
                    className="editable-title"
                    value={slide.title}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        onSlideChange(slide.id, 'title', e.target.value);
                        autoResizeTextarea(e.target);
                    }}
                    rows={1}
                    onFocus={(e) => autoResizeTextarea(e.target)}
                />
                <select
                    className="template-select"
                    value={slide.template}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSlideChange(slide.id, 'template', e.target.value)}
                >
                    {availableSlideTemplates.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
            </div>
            <div className="editable-bullets">
                {slide.bullets.map((bullet, i) => (
                    <div key={i} className="bullet-item">
                        <span className="bullet-point">•</span>
                        <textarea
                            className="editable-bullet"
                            value={bullet}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                onBulletChange(slide.id, i, e.target.value);
                                autoResizeTextarea(e.target);
                            }}
                            rows={1}
                            onFocus={(e) => autoResizeTextarea(e.target)}
                        />
                        <button className="bullet-action-button" onClick={() => onRemoveBullet(slide.id, i)} title="Remove bullet" aria-label="Remove bullet">×</button>
                        <button className="bullet-action-button" onClick={() => onAddBullet(slide.id, i)} title="Add bullet below" aria-label="Add bullet below">+</button>
                    </div>
                ))}
            </div>
            <div className="speaker-notes-section">
                <h4>Speaker Notes</h4>
                <textarea
                    className="editable-speaker-notes"
                    value={slide.speakerNotes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        onSlideChange(slide.id, 'speakerNotes', e.target.value);
                        autoResizeTextarea(e.target);
                    }}
                    placeholder="Add talking points, cues, or examples..."
                    rows={2}
                    onFocus={(e) => autoResizeTextarea(e.target)}
                />
            </div>
            <div className="slide-editor-controls">
                <button onClick={() => onMoveSlide(index, 'up')} disabled={index === 0} title="Move Up" aria-label="Move slide up">▲</button>
                <button onClick={() => onMoveSlide(index, 'down')} disabled={index === totalSlides - 1} title="Move Down" aria-label="Move slide down">▼</button>
                {!slide.imageUrl && !generatingImageIds.has(slide.id) && (
                    <button onClick={() => onGenerateImage(slide.id)} title="Generate Image" aria-label="Generate image for this slide">🖼️</button>
                )}
                <button className="delete-slide-btn" onClick={() => onDeleteSlide(slide.id)} title="Delete Slide" aria-label="Delete slide">🗑️</button>
            </div>
        </div>
    );
});


const SlideEditor = ({ slides, setSlides, templates }: SlideEditorProps) => {
    const [generatingImageIds, setGeneratingImageIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [imageStyle, setImageStyle] = useState<'abstract' | 'realistic' | 'cartoon'>('abstract');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1'>('16:9');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleSlideChange = useCallback((id: string, field: keyof Omit<SlideContent, 'id'>, value: any) => {
        setSlides(prevSlides => prevSlides!.map(s => s.id === id ? { ...s, [field]: value } : s));
    }, [setSlides]);

    const handleBulletChange = useCallback((slideId: string, bulletIndex: number, value: string) => {
        setSlides(prevSlides => prevSlides!.map(s => {
            if (s.id === slideId) {
                const newBullets = [...s.bullets];
                newBullets[bulletIndex] = value;
                return { ...s, bullets: newBullets };
            }
            return s;
        }));
    }, [setSlides]);

    const addBullet = useCallback((slideId: string, bulletIndex: number) => {
        setSlides(prevSlides => prevSlides!.map(s => {
            if (s.id === slideId) {
                const newBullets = [...s.bullets];
                newBullets.splice(bulletIndex + 1, 0, "");
                return { ...s, bullets: newBullets };
            }
            return s;
        }));
    }, [setSlides]);

    const removeBullet = useCallback((slideId: string, bulletIndex: number) => {
        setSlides(prevSlides => prevSlides!.map(s => {
            if (s.id === slideId) {
                const newBullets = s.bullets.filter((_, i) => i !== bulletIndex);
                return { ...s, bullets: newBullets.length > 0 ? newBullets : [""] };
            }
            return s;
        }));
    }, [setSlides]);

    const addSlide = useCallback(() => {
        const newSlide: SlideContent = {
            id: `slide_new_${Date.now()}`,
            title: "New Slide Title",
            bullets: ["New bullet point."],
            template: "content_visual",
            speakerNotes: "",
        };
        setSlides(prevSlides => [...(prevSlides || []), newSlide]);
    }, [setSlides]);

    const deleteSlide = useCallback((id: string) => {
        setSlides(prevSlides => prevSlides!.filter(s => s.id !== id));
    }, [setSlides]);

    const moveSlide = useCallback((index: number, direction: 'up' | 'down') => {
        setSlides(prevSlides => {
            if (!prevSlides) return null;
            const newSlides = [...prevSlides];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newSlides.length) return newSlides;
            
            const [movedSlide] = newSlides.splice(index, 1);
            newSlides.splice(targetIndex, 0, movedSlide);
            return newSlides;
        });
    }, [setSlides]);


    if (!slides) {
        return (
            <div className="placeholder">
                <div className="placeholder-icon">✨</div>
                <h2>Your Deck Will Appear Here</h2>
                <p>Fill out the prompt and select a template to get started.</p>
            </div>
        );
    }

    const handleExport = async () => {
        if (!slides || slides.length === 0) return;
        setIsExporting(true);
        setExportError(null);
        try {
            const pptx = new PptxGenJS();
            pptx.layout = "LAYOUT_16x9";
    
            for (const slide of slides) {
                const pptxSlide = pptx.addSlide();
                
                pptxSlide.addText(slide.title, { x: 0.5, y: 0.25, w: '90%', h: 0.75, fontSize: 32, bold: true, color: "003da5" });
                
                if (slide.imageUrl) {
                    pptxSlide.addImage({ data: slide.imageUrl, x: 0.5, y: 1.2, w: '45%', h: '60%' });
                }

                const bulletOptions = {
                    x: slide.imageUrl ? '55%' : 0.5,
                    y: 1.2,
                    w: slide.imageUrl ? '40%' : '90%',
                    h: '70%',
                    bullet: true,
                    fontSize: 18,
                    color: "001f54"
                };
                pptxSlide.addText(slide.bullets.join('\n'), bulletOptions);

                if (slide.speakerNotes) {
                    pptxSlide.addNotes(slide.speakerNotes);
                }
            }
    
            await pptx.writeFile({ fileName: 'presentation.pptx' });
        } catch (error) {
            console.error("Failed to export PPTX:", error);
            setExportError("An error occurred during the export. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const generateImageForSlide = async (
        slide: SlideContent,
        style: 'abstract' | 'realistic' | 'cartoon',
        ratio: '16:9' | '4:3' | '1:1'
    ): Promise<{ slideId: string, imageUrl: string | null }> => {
        const formattedTemplateName = slide.template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const generationPrompt = `Generate a professional, ${style}, minimalist background image suitable for a corporate presentation slide. The slide is a "${formattedTemplateName}" template, titled "${slide.title}". The content includes these points: ${slide.bullets.join(', ')}. The image should be visually appealing, relevant to the content and template type, but not distracting.`;
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: generationPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: ratio,
                },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            return { slideId: slide.id, imageUrl };
        } catch (error) {
            console.error(`Failed to generate image for slide: ${slide.title}`, error);
            return { slideId: slide.id, imageUrl: null };
        }
    };

    const handleGenerateSingleImage = useCallback(async (slideId: string) => {
        const slideToUpdate = slides?.find(s => s.id === slideId);
        if (!slideToUpdate) return;

        setGeneratingImageIds(prev => new Set(prev).add(slideId));

        const result = await generateImageForSlide(slideToUpdate, imageStyle, aspectRatio);

        if (result.imageUrl) {
            setSlides(prevSlides => {
                if (!prevSlides) return null;
                return prevSlides.map(s => s.id === result.slideId ? { ...s, imageUrl: result.imageUrl } : s);
            });
        }
        
        setGeneratingImageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(slideId);
            return newSet;
        });
    }, [slides, setSlides, ai.models, imageStyle, aspectRatio]);

    const handleGenerateImages = async () => {
        if (!slides) return;
        const slidesToGenerateFor = slides.filter(s => !s.imageUrl);
        if (slidesToGenerateFor.length === 0) return;

        const idsToGenerate = slidesToGenerateFor.map(s => s.id);
        setGeneratingImageIds(prev => new Set([...prev, ...idsToGenerate]));

        const imagePromises = slidesToGenerateFor.map(slide => generateImageForSlide(slide, imageStyle, aspectRatio));
        const results = await Promise.all(imagePromises);
        
        setSlides(prevSlides => {
            if (!prevSlides) return null;
            const newSlides = [...prevSlides];
            results.forEach(result => {
                if (result.imageUrl) {
                    const slideIndex = newSlides.findIndex(s => s.id === result.slideId);
                    if (slideIndex !== -1) {
                        newSlides[slideIndex].imageUrl = result.imageUrl;
                    }
                }
            });
            return newSlides;
        });

        setGeneratingImageIds(prev => {
            const newSet = new Set(prev);
            idsToGenerate.forEach(id => newSet.delete(id));
            return newSet;
        });
    };
    
    const availableSlideTemplates = useMemo(() => {
        const allTemplates = Object.values(templates).flatMap(t => t.blueprint.map(b => b.template));
        return [...new Set(allTemplates)];
    }, [templates]);

    return (
        <div className="slide-deck-preview slide-editor">
             <div className="preview-header">
                <h2>Edit Your Deck</h2>
                <div>
                    <div className="button-group">
                        <div className="image-gen-controls">
                            <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value as 'abstract' | 'realistic' | 'cartoon')} aria-label="Image Style">
                                <option value="abstract">Abstract Style</option>
                                <option value="realistic">Realistic Style</option>
                                <option value="cartoon">Cartoon Style</option>
                            </select>
                            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '4:3' | '1:1')} aria-label="Image Aspect Ratio">
                                <option value="16:9">16:9</option>
                                <option value="4:3">4:3</option>
                                <option value="1:1">1:1</option>
                            </select>
                            <button 
                                className="action-button secondary" 
                                onClick={handleGenerateImages} 
                                disabled={generatingImageIds.size > 0 || !slides || slides.length === 0}
                            >
                                {generatingImageIds.size > 0 ? 'Generating...' : '✨ Add Imagery'}
                            </button>
                        </div>
                        <button
                            className="action-button"
                            onClick={handleExport}
                            disabled={isExporting || slides.length === 0}
                        >
                            {isExporting ? 'Exporting...' : 'Export to PPTX'}
                        </button>
                    </div>
                    {exportError && <p className="error-message" style={{ textAlign: 'right', marginTop: '0.5rem', padding: '0.5rem' }}>{exportError}</p>}
                </div>
            </div>
            {slides.map((slide, index) => (
                <EditableSlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    totalSlides={slides.length}
                    availableSlideTemplates={availableSlideTemplates}
                    generatingImageIds={generatingImageIds}
                    onSlideChange={handleSlideChange}
                    onBulletChange={handleBulletChange}
                    onAddBullet={addBullet}
                    onRemoveBullet={removeBullet}
                    onMoveSlide={moveSlide}
                    onDeleteSlide={deleteSlide}
                    onGenerateImage={handleGenerateSingleImage}
                />
            ))}
             <button className="secondary-button add-slide-button" onClick={addSlide}>+ Add New Slide</button>
        </div>
    );
}

export default SlideEditor;