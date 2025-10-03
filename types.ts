// types.ts

export type Role = 'Administrator' | 'Content Manager' | 'Team Member' | 'Read Only';
export type Permission = 'generate' | 'upload' | 'manage_content' | 'manage_users' | 'view_settings' | 'view_admin_panel';
export type OnboardingStep = 'welcome' | 'method' | 'upload' | 'url' | 'review' | 'done';

export interface User {
  id: string;
  name: string;
  role: Role;
  points: number;
}

export interface SlideContent {
  id: string;
  title: string;
  bullets: string[];
  template: string;
  imageUrl?: string;
  speakerNotes?: string;
}

export interface IngestedSlide {
  pageNum: number;
  text: string;
}

export interface IngestedDocument {
  name: string;
  source: string;
  slides: IngestedSlide[];
  summary?: string;
  keyInsights?: string[];
  dateAdded: string;
  status: string; // e.g., 'pending', 'indexed'
  ownerId: string;
  sharing: 'private' | 'organization';
}

export interface SearchResult {
  docName: string;
  slide: IngestedSlide;
}

export interface Agent {
  id:string;
  name: string;
  systemPrompt: string;
}

export interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
}

export interface BlueprintSlide {
  template: string;
  title: string;
  bullets: string[];
}

export interface CVISettings {
  primaryColors: string[];
  fontFamilies: {
    heading: string;
    body: string;
  };
}

export interface Template {
  name:string;
  description: string;
  blueprint: BlueprintSlide[];
  ownerId?: string;
  isDerived?: boolean;
  isCompanyDefault?: boolean;
  cvi?: CVISettings;
}

export interface AdminLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
}

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

export type Tab = "dashboard" | "generate" | "library" | "search" | "analytics" | "settings" | "admin";
export type LibraryView = 'my' | 'shared' | 'all';