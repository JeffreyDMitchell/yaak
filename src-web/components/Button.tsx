import { ButtonHTMLAttributes, forwardRef } from 'react';
import classnames from 'classnames';
import { Icon } from './Icon';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  forDropdown?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, children, size = 'md', forDropdown, color, ...props }: ButtonProps,
  ref,
) {
  return (
    <button
      ref={ref}
      className={classnames(
        className,
        'rounded-md text-white flex items-center',
        { 'h-10 px-4': size === 'md' },
        { 'h-8 px-3': size === 'sm' },
        { 'hover:bg-gray-500/[0.1] active:bg-gray-500/[0.15]': color === undefined },
        { 'bg-blue-500 hover:bg-blue-500/90 active:bg-blue-500/80': color === 'primary' },
        { 'bg-violet-500 hover:bg-violet-500/90 active:bg-violet-500/80': color === 'secondary' },
      )}
      {...props}
    >
      {children}
      {forDropdown && <Icon icon="triangle-down" className="ml-1 -mr-1" />}
    </button>
  );
});