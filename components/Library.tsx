import React, { useState, useContext, ChangeEvent, DragEvent, useCallback } from 'react';
import { AppContext } from '../AppContext';
import { LibraryView, IngestedDocument } from '../types';
import { hasPermission } from '../lib/permissions';
import { parsePptx, parsePdf } from '../lib/fileParsers';
import { GoogleGenAI } from '@google/genai';
import EmptyState from './EmptyState';

const Library = () => {
    const { currentUser, ingestedDocs, setIngestedDocs, agents, addNotification } = useContext(AppContext);
    const [libraryView, setLibraryView] = useState<LibraryView>('my');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement> | DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const files = 'dataTransfer' in e ? e.dataTransfer?.files : e.target.files;

        if (!files || !currentUser) return;

        // FIX: Explicitly cast `Array.from(files)` to `File[]` to ensure `file` is typed correctly.
        for (const file of Array.from(files) as File[]) {
            const tempId = `doc_${file.name}_${Date.now()}`;
            const tempDoc: IngestedDocument = {
                name: file.name,
                source: "File Upload",
                slides: [],
                dateAdded: new Date().toISOString(),
                status: 'Parsing...',
                ownerId: currentUser.id,
                sharing: 'private'
            };

            // Add temporary doc to UI immediately
            setIngestedDocs(prev => new Map(prev).set(tempId, tempDoc));

            try {
                let textContent = "";
                if (file.type === "application/pdf") {
                    textContent = await parsePdf(file);
                } else if (file.name.endsWith('.pptx')) {
                    textContent = await parsePptx(file);
                } else {
                    throw new Error("Unsupported file type.");
                }

                setIngestedDocs(prev => new Map(prev).set(tempId, { ...tempDoc, status: 'Indexing with AI...' }));

                const summarizerAgent = agents['summarizer'];
                if (!summarizerAgent) throw new Error("Summarizer agent not found.");

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: textContent,
                    config: {
                        systemInstruction: summarizerAgent.systemPrompt,
                        responseMimeType: "application/json"
                    }
                });

                const { summary, keyInsights } = JSON.parse(response.text.trim());

                const finalDoc: IngestedDocument = {
                    ...tempDoc,
                    summary,
                    keyInsights,
                    // In a real app, slides would be properly chunked. Here, we add all text as one "slide" for searchability.
                    slides: [{ pageNum: 1, text: textContent }],
                    status: 'Indexed'
                };
                setIngestedDocs(prev => new Map(prev).set(tempId, finalDoc));
                addNotification(`"${file.name}" indexed successfully.`, 'success');


            } catch (err: any) {
                console.error("File processing error:", err);
                setIngestedDocs(prev => new Map(prev).set(tempId, { ...tempDoc, status: `Error: ${err.message}` }));
                addNotification(`Error processing "${file.name}": ${err.message}`, 'error');
            }
        }
    }, [currentUser, setIngestedDocs, agents, ai.models, addNotification]);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const docsToShow = Array.from(ingestedDocs.values()).filter((doc: IngestedDocument) => {
        if (!currentUser) return false;
        if (libraryView === 'my') return doc.ownerId === currentUser.id;
        if (libraryView === 'shared') return doc.sharing === 'organization' && doc.ownerId !== currentUser.id;
        if (libraryView === 'all') return hasPermission(currentUser, 'manage_content');
        return false;
    // FIX: Explicitly type `a` and `b` as `IngestedDocument` to resolve `dateAdded` property.
    }).sort((a: IngestedDocument, b: IngestedDocument) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

    return (
        <div className="tab-content">
            <div className="library-panel">
                <aside className="form-panel">
                    <h3>Add to Library</h3>
                    {hasPermission(currentUser, 'upload') && (
                        <div className="form-group">
                            <div 
                                className="upload-box" 
                                onClick={() => document.getElementById('file-upload')?.click()}
                                onDrop={handleFileUpload}
                                onDragOver={handleDragOver}
                            >
                                <p>Drag & Drop or Click to Upload</p>
                                <span>Supports .pptx and .pdf files</span>
                                <input type="file" id="file-upload" hidden multiple onChange={handleFileUpload} accept=".pdf,.pptx"/>
                            </div>
                        </div>
                    )}
                </aside>
                <div className="library-main">
                    <div className="library-header">
                        <h2>Document Library</h2>
                        <div className="view-toggle">
                            <button className={libraryView === 'my' ? 'active' : ''} onClick={() => setLibraryView('my')}>My Content</button>
                            <button className={libraryView === 'shared' ? 'active' : ''} onClick={() => setLibraryView('shared')}>Shared</button>
                            {hasPermission(currentUser, 'manage_content') && (
                                <button className={libraryView === 'all' ? 'active' : ''} onClick={() => setLibraryView('all')}>All Content</button>
                            )}
                        </div>
                    </div>
                    <div className="library-grid">
                       {docsToShow.length > 0 ? docsToShow.map((doc: IngestedDocument, index) => (
                           <div key={`${doc.name}-${index}`} className="doc-card">
                               <div className="doc-card-content">
                                   <div className="doc-card-header">
                                        <div className="doc-card-header-top">
                                            <h3>{doc.name}</h3>
                                            <span className={`sharing-status ${doc.sharing}`}>{doc.sharing}</span>
                                        </div>
                                        <div className="doc-card-meta">
                                            Added on {new Date(doc.dateAdded).toLocaleDateString()}
                                        </div>
                                   </div>
                                   {doc.summary ? (
                                       <div className="doc-card-summary">
                                           <h4>Summary</h4>
                                           <p>{doc.summary}</p>
                                           {doc.keyInsights && (
                                                <>
                                                    <h4 style={{marginTop: '1rem'}}>Key Insights</h4>
                                                    <ul>{doc.keyInsights.map((insight, i) => <li key={i}>{insight}</li>)}</ul>
                                                </>
                                           )}
                                       </div>
                                   ) : (
                                       <p className="doc-card-status">{doc.status}</p>
                                   )}
                               </div>
                               <div className="doc-card-actions">
                                   <button className="action-button" disabled={doc.status !== 'Indexed'}>Use Content</button>
                               </div>
                           </div>
                       )) : (
                           <EmptyState
                                icon="📚"
                                title="Library is Empty"
                                message="There are no documents in this view. Upload your first document to get started."
                                actionText={hasPermission(currentUser, 'upload') ? 'Upload Document' : undefined}
                                onAction={hasPermission(currentUser, 'upload') ? () => document.getElementById('file-upload')?.click() : undefined}
                           />
                       )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Library;