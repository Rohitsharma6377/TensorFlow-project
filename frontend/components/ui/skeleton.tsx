import * as React from 'react';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} {...props} />
);

export default Skeleton;
