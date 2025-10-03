import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { hasPermission } from '../lib/permissions';
import { Role, Agent } from '../types';

const Settings = () => {
    const { currentUser, agents, setAgents, allUsers, adminLog, handleRoleChange, addNotification } = useContext(AppContext);
    const [localAgents, setLocalAgents] = useState(agents);

    useEffect(() => {
        setLocalAgents(agents);
    }, [agents]);

    const handleLocalAgentPromptChange = (agentId: string, newPrompt: string) => {
        setLocalAgents(prev => ({
            ...prev,
            [agentId]: { ...prev[agentId], systemPrompt: newPrompt }
        }));
    };

    const saveAgentChanges = (agentId: string) => {
        if (agents[agentId].systemPrompt !== localAgents[agentId].systemPrompt) {
            setAgents(prev => ({
                ...prev,
                [agentId]: localAgents[agentId]
            }));
            addNotification(`${localAgents[agentId].name} prompt updated.`, 'success');
        }
    };

    return (
        <div className="tab-content">
            <div className="settings-panel">
                <div className="settings-section">
                    <h3>Agent Configuration</h3>
                    {Object.values(localAgents).map((agent: Agent) => (
                        <div key={agent.id} className="agent-config-card form-group">
                            <h4>{agent.name}</h4>
                            <textarea
                                className="prompt-input"
                                value={agent.systemPrompt}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleLocalAgentPromptChange(agent.id, e.target.value)}
                                onBlur={() => saveAgentChanges(agent.id)}
                            />
                        </div>
                    ))}
                </div>

                {hasPermission(currentUser, 'manage_users') && (
                    <div className="settings-section">
                        <h3>User Management</h3>
                         <table className="user-management-table">
                           <thead><tr><th>User</th><th>Role</th><th>Points</th></tr></thead>
                           <tbody>
                            {allUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>
                                        <select value={user.role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRoleChange(user.id, e.target.value as Role)}>
                                            <option value="Administrator">Administrator</option>
                                            <option value="Content Manager">Content Manager</option>
                                            <option value="Team Member">Team Member</option>
                                            <option value="Read Only">Read Only</option>
                                        </select>
                                    </td>
                                    <td>{user.points}</td>
                                </tr>
                            ))}
                           </tbody>
                         </table>
                    </div>
                )}
                 {hasPermission(currentUser, 'manage_users') && (
                    <div className="settings-section">
                        <h3>Administrative Action Log</h3>
                         <div className="admin-log">
                            {adminLog.length > 0 ? adminLog.map(entry => (
                                <div key={entry.id} className="log-entry">
                                    <span className="timestamp">{new Date(entry.timestamp).toLocaleString()}</span>
                                    <p><strong>{entry.adminName}</strong>: {entry.action}</p>
                                </div>
                            )) : <p>No administrative actions have been logged.</p>}
                         </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default Settings;