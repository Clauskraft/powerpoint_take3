// lib/fileParsers.ts

// These are loaded from CDNs in index.html
declare const pdfjsLib: any;
declare const JSZip: any;

/**
 * Parses a PPTX file and extracts all text content.
 * @param file The PPTX file object.
 * @returns A promise that resolves to the combined text of all slides.
 */
export const parsePptx = async (file: File): Promise<string> => {
    const zip = await JSZip.loadAsync(file);
    const slidePromises: Promise<string>[] = [];

    // Find all slide XML files
    zip.folder('ppt/slides')?.forEach((relativePath, zipEntry) => {
        if (zipEntry.name.endsWith('.xml') && !zipEntry.name.includes('_rels')) {
            slidePromises.push(zipEntry.async('string'));
        }
    });

    const slideXmls = await Promise.all(slidePromises);
    const textContents = slideXmls.map(xml => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'application/xml');
        const textNodes = xmlDoc.getElementsByTagName('a:t');
        let slideText = '';
        if (textNodes) {
            for (let i = 0; i < textNodes.length; i++) {
                slideText += textNodes[i].textContent + ' ';
            }
        }
        return slideText.trim();
    });

    return textContents.join('\n\n');
};


/**
 * Parses a PDF file and extracts all text content.
 * @param file The PDF file object.
 * @returns A promise that resolves to the combined text of all pages.
 */
export const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const pagePromises: Promise<string>[] = [];

    for (let i = 1; i <= numPages; i++) {
        pagePromises.push(
            pdf.getPage(i).then((page: any) =>
                page.getTextContent().then((textContent: any) =>
                    textContent.items.map((item: any) => item.str).join(' ')
                )
            )
        );
    }

    const pageTexts = await Promise.all(pagePromises);
    return pageTexts.join('\n\n');
};
