import React, { createContext, useState, useEffect, PropsWithChildren } from 'react';
import { User, IngestedDocument, Template, Agent, AdminLogEntry, Role, Notification } from './types';
import { INITIAL_USERS, INITIAL_TEMPLATES, INITIAL_AGENTS } from './lib/initialData';

// The shape of the context
export interface IAppContext {
    currentUser: User | null;
    allUsers: User[];
    adminLog: AdminLogEntry[];
    ingestedDocs: Map<string, IngestedDocument>;
    templates: Record<string, Template>;
    agents: Record<string, Agent>;
    isOnboarding: boolean;
    notifications: Notification[];
    setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setAdminLog: React.Dispatch<React.SetStateAction<AdminLogEntry[]>>;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    setIngestedDocs: React.Dispatch<React.SetStateAction<Map<string, IngestedDocument>>>;
    setTemplates: React.Dispatch<React.SetStateAction<Record<string, Template>>>;
    setAgents: React.Dispatch<React.SetStateAction<Record<string, Agent>>>;
    setIsOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
    addLogEntry: (action: string) => void;
    handleRoleChange: (userId: string, newRole: Role) => void;
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeNotification: (id: number) => void;
}

// Create the context with a default value
export const AppContext = createContext<IAppContext>({
    currentUser: null,
    allUsers: [],
    adminLog: [],
    ingestedDocs: new Map(),
    templates: {},
    agents: {},
    isOnboarding: false,
    notifications: [],
    setAllUsers: () => {},
    setAdminLog: () => {},
    setCurrentUser: () => {},
    setIngestedDocs: () => {},
    setTemplates: () => {},
    setAgents: () => {},
    setIsOnboarding: () => {},
    addLogEntry: () => {},
    handleRoleChange: () => {},
    addNotification: () => {},
    removeNotification: () => {},
});

// Create the provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
    const [allUsers, setAllUsers] = useState<User[]>(() => { try { const saved = localStorage.getItem('powerpoint_allUsers'); return saved ? JSON.parse(saved) : INITIAL_USERS; } catch { return INITIAL_USERS; } });
    const [adminLog, setAdminLog] = useState<AdminLogEntry[]>(() => { try { const saved = localStorage.getItem('powerpoint_adminLog'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
    const [currentUser, setCurrentUser] = useState<User | null>(allUsers.find(u => u.role === 'Administrator')!);
    
    // User-specific states that depend on currentUser
    const [ingestedDocs, setIngestedDocs] = useState<Map<string, IngestedDocument>>(new Map());
    const [templates, setTemplates] = useState<Record<string, Template>>(INITIAL_TEMPLATES);
    const [agents, setAgents] = useState<Record<string, Agent>>(INITIAL_AGENTS);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);


    // Load/Save global data
    useEffect(() => { localStorage.setItem('powerpoint_allUsers', JSON.stringify(allUsers)); }, [allUsers]);
    useEffect(() => { localStorage.setItem('powerpoint_adminLog', JSON.stringify(adminLog)); }, [adminLog]);

    // Load user-specific data when currentUser changes
    useEffect(() => {
        if (currentUser) {
            const loadUserData = (key: string, initialValue: any) => {
                try { const saved = localStorage.getItem(`${currentUser.id}_${key}`); return saved ? JSON.parse(saved) : initialValue; } catch (e) { console.error(`Failed to load ${key}`, e); return initialValue; }
            };
            const loadedTemplates = loadUserData('powerpoint_templates', INITIAL_TEMPLATES);
            setTemplates(loadedTemplates);
            
            const loadedAgents = loadUserData('powerpoint_agents', {});
            setAgents(prev => ({...INITIAL_AGENTS, ...(typeof loadedAgents === 'object' && loadedAgents && !Array.isArray(loadedAgents) ? loadedAgents : {})}));
            
            const docsData = loadUserData('powerpoint_docs', []);
            setIngestedDocs(new Map<string, IngestedDocument>(Array.isArray(docsData) ? docsData : []));
            
        } else {
            // Reset to defaults if no user
            setTemplates(INITIAL_TEMPLATES);
            setIngestedDocs(new Map());
            setAgents(INITIAL_AGENTS);
        }
    }, [currentUser]);

    // Check for onboarding when user or templates change for robust detection.
    useEffect(() => {
        if (currentUser?.role === 'Administrator') {
            const hasCompanyDefault = Object.values(templates).some((t: Template) => t.isCompanyDefault);
            setIsOnboarding(!hasCompanyDefault);
        } else {
            setIsOnboarding(false);
        }
    }, [currentUser, templates]);

    // Save user-specific data when it changes
    useEffect(() => { if(currentUser) localStorage.setItem(`${currentUser.id}_powerpoint_docs`, JSON.stringify(Array.from(ingestedDocs.entries()))); }, [ingestedDocs, currentUser]);
    useEffect(() => { if(currentUser) localStorage.setItem(`${currentUser.id}_powerpoint_templates`, JSON.stringify(templates)); }, [templates, currentUser]);
    useEffect(() => { if(currentUser) localStorage.setItem(`${currentUser.id}_powerpoint_agents`, JSON.stringify(agents)); }, [agents, currentUser]);

    const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeNotification(id);
        }, 5000); // Auto-dismiss after 5 seconds
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const addLogEntry = (action: string) => {
        if (!currentUser) return;
        const newEntry: AdminLogEntry = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            adminName: currentUser.name,
            action: action,
        };
        setAdminLog(prev => [newEntry, ...prev]);
    };

    const handleRoleChange = (userId: string, newRole: Role) => {
        const userToUpdate = allUsers.find(u => u.id === userId);
        if (userToUpdate && currentUser?.role === 'Administrator') {
            addLogEntry(`Changed ${userToUpdate.name}'s role from ${userToUpdate.role} to ${newRole}.`);
            setAllUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
            addNotification(`${userToUpdate.name}'s role updated to ${newRole}.`, 'success');
        }
    };

    const value = {
        currentUser, setCurrentUser,
        allUsers, setAllUsers,
        adminLog, setAdminLog,
        ingestedDocs, setIngestedDocs,
        templates, setTemplates,
        agents, setAgents,
        isOnboarding, setIsOnboarding,
        addLogEntry, handleRoleChange,
        notifications, addNotification, removeNotification,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};