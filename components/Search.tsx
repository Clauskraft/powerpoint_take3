import React, { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { SearchResult } from '../types';
import EmptyState from './EmptyState';

const Search = () => {
    const { ingestedDocs } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const results: SearchResult[] = [];
        const query = searchQuery.toLowerCase();
        ingestedDocs.forEach(doc => {
            doc.slides.forEach(slide => {
                if (slide.text.toLowerCase().includes(query)) {
                    results.push({ docName: doc.name, slide });
                }
            });
        });
        setSearchResults(results);
    };

    return (
        <div className="tab-content">
            <div className="library-panel">
                <aside className="form-panel">
                    <h3>Search Content</h3>
                    <div className="form-group">
                        <input
                            type="search"
                            className="search-input"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search across all documents..."
                        />
                    </div>
                    <button className="primary-button" onClick={handleSearch}>Search</button>
                </aside>
                <div className="search-results-panel">
                     {searchResults ? (
                        searchResults.length > 0 ? (
                            searchResults.map((result, index) => (
                                <div key={index} className="search-result-card">
                                    <div className="search-result-content">
                                        <p className="source">From: {result.docName} (Slide {result.slide.pageNum})</p>
                                        <p className="content-snippet" dangerouslySetInnerHTML={{__html: result.slide.text.replace(new RegExp(searchQuery, 'gi'), (match) => `<mark>${match}</mark>`)}} />
                                    </div>
                                </div>
                            ))
                        ) : (
                           <EmptyState
                                icon="🧐"
                                title="No Results Found"
                                message={`Your search for "${searchQuery}" did not return any results.`}
                           />
                        )
                     ) : (
                        <EmptyState
                           icon="🔍"
                           title="Search Your Content Library"
                           message="Enter a query in the search bar to find relevant information across all indexed documents."
                        />
                     )}
                </div>
            </div>
        </div>
    );
};

export default Search;