import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import { User, IngestedDocument, Template } from '../types';

const AdminPanel = () => {
    const { allUsers, ingestedDocs, templates } = useContext(AppContext);

    const getUserStats = (user: User) => {
        const docsCreated = Array.from(ingestedDocs.values()).filter((d: IngestedDocument) => d.ownerId === user.id).length;
        const templatesDerived = Object.values(templates).filter((t: Template) => t.ownerId === user.id && t.isDerived).length;
        const docsShared = Array.from(ingestedDocs.values()).filter((d: IngestedDocument) => d.ownerId === user.id && d.sharing === 'organization').length;
        return { docsCreated, templatesDerived, docsShared };
    };

    return (
        <div className="tab-content">
            <div className="admin-panel">
                <h2>Administrator Panel</h2>
                <p>Oversee all users and their contributions to the platform.</p>
                <div className="settings-section">
                    <h3>User Overview</h3>
                    <table className="user-management-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Points</th>
                                <th>Docs Created</th>
                                <th>Templates Derived</th>
                                <th>Docs Shared</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map(user => {
                                const stats = getUserStats(user);
                                return (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.role}</td>
                                        <td>{user.points}</td>
                                        <td>{stats.docsCreated}</td>
                                        <td>{stats.templatesDerived}</td>
                                        <td>{stats.docsShared}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;