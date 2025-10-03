import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import { IngestedDocument } from '../types';

const Analytics = () => {
    const { allUsers, ingestedDocs } = useContext(AppContext);

    const sortedUsers = [...allUsers].sort((a, b) => b.points - a.points);
    const totalDocs = ingestedDocs.size;
    const totalSlides = Array.from(ingestedDocs.values()).reduce((sum: number, doc: IngestedDocument) => sum + doc.slides.length, 0);

    return (
        <div className="tab-content">
            <div className="analytics-grid">
                <div className="widget">
                    <h3>Total Documents</h3>
                    <p className="stat">{totalDocs}</p>
                </div>
                <div className="widget">
                    <h3>Total Slides Indexed</h3>
                    <p className="stat">{totalSlides}</p>
                </div>
                <div className="widget">
                    <h3>Active Users</h3>
                    <p className="stat">{allUsers.length}</p>
                </div>
                 <div className="widget leaderboard">
                    <h3>Leaderboard</h3>
                    <ol>
                        {sortedUsers.map((user, index) => (
                            <li key={user.id}>
                                <div>
                                    <span className="rank">{index + 1}.</span>
                                    <span>{user.name}</span>
                                </div>
                                <span className="points">{user.points} pts</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Analytics;