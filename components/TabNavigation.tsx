import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import { hasPermission } from '../lib/permissions';
import { Tab } from '../types';

interface TabNavigationProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const TabNavigation = ({ activeTab, setActiveTab }: TabNavigationProps) => {
    const { currentUser } = useContext(AppContext);

    const tabs: { id: Tab; label: string; permission?: 'generate' | 'view_settings' | 'view_admin_panel' }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'generate', label: 'Generate Deck', permission: 'generate' },
        { id: 'library', label: 'Library' },
        { id: 'search', label: 'Search Content' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'settings', label: 'Settings', permission: 'view_settings' },
        { id: 'admin', label: 'Admin Panel', permission: 'view_admin_panel' },
    ];

    return (
        <nav className="tabs">
            {tabs.map(tab => {
                if (tab.permission && !hasPermission(currentUser, tab.permission)) {
                    return null;
                }
                return (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
};

export default TabNavigation;
