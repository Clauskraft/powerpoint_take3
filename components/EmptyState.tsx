import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionText, onAction }) => {
  return (
    <div className="placeholder empty-state">
      <div className="placeholder-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionText && onAction && (
        <button className="secondary-button" style={{ marginTop: '1rem' }} onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
