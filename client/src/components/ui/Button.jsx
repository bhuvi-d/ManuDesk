import React from 'react';

const Button = React.forwardRef(({
  className = '',
  variant = 'default',
  size = 'md',
  children,
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90',
    secondary: 'bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-100/80',
    outline: 'border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 hover:text-zinc-900',
    destructive: 'bg-red-600 text-zinc-50 shadow-sm hover:bg-red-600/90',
    ghost: 'hover:bg-zinc-100 hover:text-zinc-900',
    link: 'text-zinc-900 underline-offset-4 hover:underline bg-transparent shadow-none',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 py-2 text-sm',
    lg: 'h-10 px-8 text-sm',
    icon: 'h-9 w-9',
  };

  return (
    <button
      ref={ref}
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
