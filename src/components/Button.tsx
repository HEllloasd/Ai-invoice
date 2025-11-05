interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button'
}: ButtonProps) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-medium transition-all duration-200';
  const variantClasses = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
};
