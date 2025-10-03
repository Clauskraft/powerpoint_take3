import React, { useContext } from 'react';
import { AppContext } from '../AppContext';

const Header = () => {
    const { currentUser } = useContext(AppContext);

    // In a real app, a logout function would be passed via context
    const handleLogout = () => {
        // For now, this is a placeholder
        alert("Logout functionality would be here.");
    };

    if (!currentUser) return null;

    return (
        <header>
            <h1><span className="logo">TDC Erhverv</span> CVI Knowledge Platform</h1>
            <div className="user-profile">
                <div className="points-display"><span>🏆</span> {currentUser.points} Points</div>
                <div className="user-info">
                    <div className="name">{currentUser.name}</div>
                    <div className="role">{currentUser.role}</div>
                </div>
                <button className="secondary-button" onClick={handleLogout}>Log Out</button>
            </div>
        </header>
    );
};

export default Header;
