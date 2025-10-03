import React, { useState, useContext } from 'react';
import { AppContext } from './AppContext';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import Dashboard from './components/Dashboard';
import Generator from './components/Generator';
import Library from './components/Library';
import Search from './components/Search';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import OnboardingModal from './components/OnboardingModal';
import Notification from './components/Notification';
import { hasPermission } from './lib/permissions';
import { Tab } from './types';

const App = () => {
    const { currentUser, isOnboarding, notifications, removeNotification } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");

    if (!currentUser) {
        // In a real app, this would be a router showing a login page.
        // For now, it shows nothing, as the context handles the default user.
        return null;
    }

    return (
        <div className="app-container">
            {isOnboarding && <OnboardingModal />}
            <Notification notifications={notifications} onDismiss={removeNotification} />
            <Header />
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <main>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'generate' && hasPermission(currentUser, 'generate') && <Generator />}
                {activeTab === 'library' && <Library />}
                {activeTab === 'search' && <Search />}
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'settings' && hasPermission(currentUser, 'view_settings') && <Settings />}
                {activeTab === 'admin' && hasPermission(currentUser, 'view_admin_panel') && <AdminPanel />}
            </main>
        </div>
    );
};

export default App;