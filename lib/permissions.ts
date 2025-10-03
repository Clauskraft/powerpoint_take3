// lib/permissions.ts
import { User, Role, Permission } from '../types';

export const ROLES: Record<Role, Permission[]> = {
    'Administrator': ['generate', 'upload', 'manage_content', 'manage_users', 'view_settings', 'view_admin_panel'],
    'Content Manager': ['generate', 'upload', 'manage_content', 'view_settings'],
    'Team Member': ['generate', 'upload', 'view_settings'],
    'Read Only': ['view_settings'], // Can view library/search, but no creation tabs
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
    if (!user) return false;
    return ROLES[user.role]?.includes(permission) ?? false;
};
