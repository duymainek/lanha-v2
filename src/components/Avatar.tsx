import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  name?: string; // Used for initials if src is not available
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', name }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <span className={`inline-block rounded-full overflow-hidden bg-slate-200 ${sizeClasses[size]}`}>
      {src ? (
        <img className="h-full w-full object-cover" src={src} alt={alt || name || 'Avatar'} />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-slate-600 font-semibold">
          {getInitials(name)}
        </span>
      )}
    </span>
  );
};