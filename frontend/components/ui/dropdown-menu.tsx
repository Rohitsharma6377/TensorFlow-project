import * as React from 'react';

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="relative inline-block text-left">{children}</div>;

export const DropdownMenuTrigger: React.FC<React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }> = ({ asChild, className = '', children, ...props }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, { className: `${(children as any).props?.className || ''} ${className}`, ...props });
  }
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export const DropdownMenuContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end'; forceMount?: boolean }> = ({ className = '', children, ...props }) => (
  <div className={`absolute right-0 mt-2 w-56 origin-top-right rounded-md border bg-popover text-popover-foreground shadow-lg focus:outline-none ${className}`} {...props}>
    {children}
  </div>
);

export const DropdownMenuLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`px-4 py-2 text-sm font-semibold ${className}`} {...props} />
);

export const DropdownMenuItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button className={`flex w-full items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${className}`} {...props}>
    {children}
  </button>
);

export const DropdownMenuSeparator: React.FC = () => <div className="-mx-1 my-1 h-px bg-muted" />;
