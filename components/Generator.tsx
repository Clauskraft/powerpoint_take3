import React, { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { SlideContent, Template, Agent } from '../types';
import { GoogleGenAI } from '@google/genai';
import SlideEditor from './SlideEditor';

// Mock function for client-side scraping. In a real app, this would be a server-side endpoint.
const mockScrapeUrl = async (url: string): Promise<string> => {
    console.log(`Simulating scraping for: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return `
        Scraped Content from ${url}:
        TDC Erhverv introduces the 'Future-Ready Business' package, an all-in-one solution for digital transformation.
        Key features include:
        - Blazing-fast fiber optic internet with 99.9% uptime guarantee.
        - Advanced cybersecurity suite powered by AI threat detection.
        - Scalable cloud telephony and collaboration tools.
        - Dedicated 24/7 expert support.
        This package is designed for Danish businesses aiming to enhance productivity, security, and connectivity.
    `;
};

const isValidUrl = (urlString: string) => {
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
};


const Generator = () => {
    const { currentUser, templates, agents } = useContext(AppContext);
    const [inputMode, setInputMode] = useState<'prompt' | 'url'>('prompt');
    const [prompt, setPrompt] = useState("");
    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("sales_pitch");
    const [selectedAgentId, setSelectedAgentId] = useState<string>('strategist');
    const [generatedSlides, setGeneratedSlides] = useState<SlideContent[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrl(newUrl);
        if (newUrl && !isValidUrl(newUrl)) {
            setUrlError("Please enter a valid URL (e.g., https://example.com)");
        } else {
            setUrlError(null);
        }
    };
    
    const handleGenerate = async () => {
        const hasPrompt = inputMode === 'prompt' && prompt.trim();
        const hasUrl = inputMode === 'url' && url.trim() && !urlError;

        if ((!hasPrompt && !hasUrl) || !selectedTemplate || !templates[selectedTemplate]) {
            setError("A valid prompt/URL and a template are required.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedSlides(null);

        let generationInput = "";
        if (inputMode === 'prompt') {
            setLoadingMessage("Generating Ghost Deck...");
            generationInput = prompt;
        } else {
            setLoadingMessage("Scraping URL...");
            try {
                generationInput = await mockScrapeUrl(url);
                setLoadingMessage("Generating Ghost Deck from URL content...");
            } catch (err) {
                setError("Failed to scrape URL.");
                setIsLoading(false);
                return;
            }
        }

        try {
            const template = templates[selectedTemplate];
            const selectedAgent = agents[selectedAgentId];
            const blueprintText = template.blueprint.map(s => `- ${s.title}: ${s.bullets.join(', ')}`).join('\n');
            const generationPrompt = `
                Based on the following user prompt and presentation structure, generate the content for each slide.
                User Input: "${generationInput}"
                Presentation Structure (Title: Bullets):
                ${blueprintText}

                Return a single valid JSON object. The object should be an array where each item represents a slide and has three keys: "title" (string), "bullets" (an array of strings), and "template" (string, from the original structure).
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: generationPrompt,
                config: { 
                    responseMimeType: "application/json",
                    systemInstruction: selectedAgent.systemPrompt,
                }
            });
            
            const parsedSlidesData: Omit<SlideContent, 'id'>[] = JSON.parse(response.text.trim());
            const slidesWithIds: SlideContent[] = parsedSlidesData.map((slide, index) => ({
                ...slide,
                id: `slide_${index}_${Date.now()}`
            }));

            setGeneratedSlides(slidesWithIds);

        } catch (err) {
            console.error("Generation error:", err);
            if (err instanceof SyntaxError) {
                 setError("Generation failed: The AI returned an invalid format. Please try rephrasing your prompt for a clearer result.");
            } else if (err instanceof Error) {
                 setError(`An error occurred: ${err.message}. Please check your connection and try again.`);
            } else {
                 setError("An unknown error occurred during generation. Please try again.");
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };
    
    const companyDefault = Object.entries(templates).find((entry): entry is [string, Template] => (entry[1] as Template).isCompanyDefault);
    const otherTemplates = Object.entries(templates).filter((entry): entry is [string, Template] => !(entry[1] as Template).isCompanyDefault);

    return (
        <div className="tab-content">
            <div className="main-content">
                <aside className="form-panel">
                    <h2>1. Configure Your Deck</h2>
                    
                    <div className="form-group">
                        <label>Storyline Agent</label>
                        <select className="sharing-select" value={selectedAgentId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAgentId(e.target.value)}>
                            {Object.values(agents).map((agent: Agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <div className="view-toggle" style={{ marginBottom: '1rem', padding: 0 }}>
                            <button className={inputMode === 'prompt' ? 'active' : ''} onClick={() => setInputMode('prompt')}>Prompt</button>
                            <button className={inputMode === 'url' ? 'active' : ''} onClick={() => setInputMode('url')}>Generate from URL</button>
                        </div>
                        {inputMode === 'prompt' ? (
                            <textarea className="prompt-input" value={prompt} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)} placeholder="e.g., A sales pitch for our new AI-powered analytics service..." />
                        ) : (
                            <>
                                <input className="prompt-input" type="url" value={url} onChange={handleUrlChange} placeholder="https://www.example.com" />
                                {urlError && <p style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.8rem' }}>{urlError}</p>}
                            </>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label>Select Template</label>
                        <div className="template-selector">
                            {companyDefault && (
                                <div key={companyDefault[0]} className={`template-card company-default ${selectedTemplate === companyDefault[0] ? 'selected' : ''}`} onClick={() => setSelectedTemplate(companyDefault[0])}>
                                    <h3>{companyDefault[1].name}</h3>
                                    <p>{companyDefault[1].description}</p>
                                </div>
                            )}
                            {otherTemplates.map(([key, template]) => (
                                <div key={key} className={`template-card ${selectedTemplate === key ? 'selected' : ''}`} onClick={() => setSelectedTemplate(key)}>
                                    <h3>{template.name}</h3>
                                    <p>{template.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="primary-button" onClick={handleGenerate} disabled={isLoading || (inputMode === 'prompt' ? !prompt.trim() : !url.trim() || !!urlError)}>
                        {isLoading ? loadingMessage : "Generate Ghost Deck"}
                    </button>
                    {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
                </aside>
                <section className="results-panel">
                   <SlideEditor slides={generatedSlides} setSlides={setGeneratedSlides} templates={templates} />
                </section>
            </div>
        </div>
    );
};

export default Generator;