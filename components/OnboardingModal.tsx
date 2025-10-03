import React, { useState, useContext, ChangeEvent } from 'react';
import { AppContext } from '../AppContext';
import { OnboardingStep, CVISettings, Template } from '../types';
import { INITIAL_TEMPLATES } from '../lib/initialData';
import { GoogleGenAI } from '@google/genai';
import { parsePdf, parsePptx } from '../lib/fileParsers';

// Mock function for client-side scraping. In a real app, this would be a server-side endpoint.
const mockScrapeUrl = async (url: string): Promise<string> => {
    console.log(`Simulating scraping for: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return `
        Scraped Content from ${url}:
        About Us: TDC Erhverv is a leading provider of communication and IT solutions in Denmark.
        Our brand colors are TDC Blue (#003da5) and Navy (#001f54). We also use a vibrant green (#6dbe45) for accents.
        Our typography is based on a clean, modern sans-serif font like 'Roboto' for both headings and body text to ensure readability and a professional look.
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

const OnboardingModal = () => {
    const { currentUser, setTemplates, setIsOnboarding } = useContext(AppContext);
    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [extractedCVI, setExtractedCVI] = useState<CVISettings | null>(null);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setLoadingMessage("Parsing document...");
        setError(null);

        try {
            let textContent = "";
            if (file.type === "application/pdf") {
                textContent = await parsePdf(file);
            } else if (file.name.endsWith('.pptx')) {
                textContent = await parsePptx(file);
            } else {
                throw new Error("Unsupported file type. Please upload a PDF or PPTX.");
            }
            await handleExtractCVI('file', textContent);
        } catch (err: any) {
            setError(err.message || "Failed to process the file.");
            setIsLoading(false);
        }
    };

    const handleExtractCVI = async (sourceType: 'file' | 'url', data: string) => {
        setLoadingMessage("AI is analyzing your brand identity...");
        const sourceDescription = sourceType === 'file' ? 'a brand guide document' : `the content from website`;
        const prompt = `
            You are an expert brand identity analyst. Your task is to analyze the provided content and extract the key elements of the brand's visual identity.
            From the content below, identify:
            1. Up to 5 primary brand colors. Return these as an array of hex code strings.
            2. The primary font family used for headings.
            3. The primary font family used for body text.

            The content is from ${sourceDescription}.

            Content: """
            ${data}
            """

            Return your response as a single, valid JSON object with the following structure:
            {
              "primaryColors": ["#xxxxxx"],
              "fontFamilies": { "heading": "Font Name", "body": "Font Name" }
            }
            Do not include any other text, explanations, or markdown formatting.
        `;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" },
            });
            const result: CVISettings = JSON.parse(response.text.trim());
            setExtractedCVI(result);
            setStep('review');
        } catch (err) {
            console.error(err);
            setError("The AI failed to extract brand information. Please try a different source or check your input.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrl(newUrl);
        if (newUrl && !isValidUrl(newUrl)) {
            setUrlError("Please enter a valid URL (e.g., https://example.com)");
        } else {
            setUrlError(null);
        }
    };

    const handleUrlSubmit = async () => {
        if (!url.trim() || !isValidUrl(url)) {
            setError("Please enter a valid website URL.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage("Simulating web scraping...");
        setError(null);
        try {
            const scrapedContent = await mockScrapeUrl(url);
            await handleExtractCVI('url', scrapedContent);
        } catch (err) {
            setError("Failed to simulate scraping. Please try again.");
            setIsLoading(false);
        }
    };

    const handleSaveCompanyTemplate = () => {
        if (!extractedCVI || !newTemplateName.trim() || !currentUser) return;
        const newKey = `company_default_${Date.now()}`;
        const newTemplate: Template = {
          name: newTemplateName.trim(),
          description: `Default company template for the organization.`,
          blueprint: INITIAL_TEMPLATES.sales_pitch.blueprint, // Use a generic blueprint
          ownerId: currentUser.id,
          isCompanyDefault: true,
          cvi: extractedCVI,
        };
        setTemplates(prev => ({...prev, [newKey]: newTemplate}));
        setIsOnboarding(false);
    };

    const renderStep = () => {
        switch (step) {
            case 'welcome': return (
                <>
                    <h2>Welcome, Administrator!</h2>
                    <p>Let's set up your organization's default presentation template. This will ensure all decks created by your team are consistently branded.</p>
                    <button className="primary-button" onClick={() => setStep('method')}>Get Started</button>
                </>
            );
            case 'method': return (
                <>
                    <h2>How should we find your brand identity?</h2>
                    <p>The AI will analyze your choice to extract colors and fonts.</p>
                    <div className="method-selection">
                        <div className="method-card" onClick={() => setStep('upload')}>
                            <h3>📁 Upload Brand Guide</h3>
                            <p>Use a .pdf or .pptx file as the source of truth.</p>
                        </div>
                        <div className="method-card" onClick={() => setStep('url')}>
                            <h3>🌐 Provide Website URL</h3>
                            <p>Let the AI scan your company's public website.</p>
                        </div>
                    </div>
                </>
            );
            case 'upload': return (
                <>
                    <h2>Upload Brand Document</h2>
                    <p>Choose a file that contains your brand guidelines, such as a PDF brand book or a recent PowerPoint presentation.</p>
                    <button className="primary-button" onClick={() => document.getElementById('cvi-upload')?.click()}>
                        Click to Select File
                    </button>
                    <input type="file" id="cvi-upload" hidden accept=".pdf,.pptx" onChange={handleFileChange} />
                    <div className="button-group" style={{ justifyContent: 'flex-start', marginTop: '2rem'}}>
                        <button className="secondary-button" onClick={() => setStep('method')}>Back</button>
                    </div>
                </>
            );
            case 'url': return (
                <>
                    <h2>Provide Website URL</h2>
                    <p>Enter the full URL of your company's homepage. <br/><small>(Note: Live scraping is simulated in this environment.)</small></p>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <input type="url" className="prompt-input" value={url} onChange={handleUrlChange} placeholder="https://www.tdc.dk" />
                        {urlError && <p className="error-message" style={{marginTop: '0.5rem'}}>{urlError}</p>}
                    </div>
                    <div className="button-group">
                         <button className="secondary-button" onClick={() => setStep('method')}>Back</button>
                         <button className="primary-button" onClick={handleUrlSubmit} disabled={!!urlError || isLoading}>Analyze Website</button>
                    </div>
                </>
            );
            case 'review': return (
                 <>
                    <h2>Review Extracted Identity</h2>
                    <p>Our AI has analyzed your source. Please review and name your new template.</p>
                    {extractedCVI && (
                        <div className="cvi-review">
                            <div className="form-group">
                                <label>Template Name</label>
                                <input type="text" className="prompt-input" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="e.g., Company Default" />
                            </div>
                            <div className="form-group">
                                <label>Primary Colors</label>
                                <div className="color-swatches">
                                    {extractedCVI.primaryColors.map(color => (
                                        <div key={color} className="swatch" style={{ backgroundColor: color }}>
                                            <span>{color}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div className="form-group">
                                <label>Font Families</label>
                                <div className="font-preview">
                                    <p style={{ fontFamily: extractedCVI.fontFamilies.heading }}>Heading: {extractedCVI.fontFamilies.heading}</p>
                                    <p style={{ fontFamily: extractedCVI.fontFamilies.body }}>Body: {extractedCVI.fontFamilies.body}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="button-group">
                        <button className="secondary-button" onClick={() => { setExtractedCVI(null); setStep('method'); }}>Start Over</button>
                        <button className="primary-button" onClick={handleSaveCompanyTemplate} disabled={!newTemplateName.trim()}>Save Company Template</button>
                    </div>
                </>
            );
            default: return null;
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content onboarding-modal">
                {isLoading && (
                    <div className="modal-loading">
                        <div className="loading-spinner"></div>
                        <p>{loadingMessage}</p>
                    </div>
                )}
                <div className="onboarding-stepper">
                    <div className={`step ${step === 'welcome' || step === 'method' ? 'active' : ''}`}>1. Source</div>
                    <div className={`step ${step === 'review' ? 'active' : ''}`}>2. Review</div>
                    <div className="step">3. Done</div>
                </div>
                {error && <p className="error-message">{error}</p>}
                {renderStep()}
            </div>
        </div>
    );
};

export default OnboardingModal;