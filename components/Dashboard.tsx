import React, { useContext } from 'react';
import { AppContext } from '../AppContext';

const Dashboard = () => {
    const { currentUser } = useContext(AppContext);

    return (
        <div className="tab-content">
            <div className="dashboard-grid">
                <div className="widget">
                    <h3>Welcome back, {currentUser?.name}!</h3>
                    <p>Here's a summary of your recent activity and organization updates.</p>
                </div>
                <div className="widget">
                    <h3>Your Points</h3>
                    <p className="stat">{currentUser?.points}</p>
                </div>
                 <div className="widget">
                    <h3>Quick Actions</h3>
                    <p>Start a new presentation or browse the library.</p>
                    {/* Add action buttons here */}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
