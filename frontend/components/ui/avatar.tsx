import * as React from 'react';

export const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted ${className}`} {...props}>
    {children}
  </div>
);

export const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className = '', ...props }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img className={`h-full w-full rounded-full object-cover ${className}`} {...props} alt={props.alt || ''} />
);

export const AvatarFallback: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className = '', ...props }) => (
  <span className={`text-sm font-medium text-muted-foreground ${className}`} {...props} />
);

export default Avatar;
