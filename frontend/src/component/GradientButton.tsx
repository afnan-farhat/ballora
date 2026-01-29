import React, { forwardRef } from "react";
import clsx from "clsx";

interface GradientButtonProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "mid"; // Available button sizes
  className?: string; // Custom class for extra styling
  iconLeft?: React.ReactNode; //  left-side icon
  iconRight?: React.ReactNode; // right-side icon

  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";

}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      children,
      size = "xl",
      className,
      iconLeft,
      iconRight,
      onClick,
      disabled = false, 
      title,
      type = "button",
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "w-24 h-6 text-[10px]",
      md: "w-32 h-8 text-[14px]",
      mid: "w-32 h-10 text-[14px]",
      lg: "w-40 h-8 text-[14px]",
      xl: "w-40 h-10 text-[16px]",
    };

    return (
      // Disables button interaction when true
      <button
        ref={ref}
        type={type}
        onClick={disabled ? undefined : onClick}
        title={title} 
        className={clsx(
          "text-white rounded-[8px] font-semibold flex items-center justify-center gap-1 transition-colors duration-200",
          sizeClasses[size],
          disabled
            ? "text-black bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-[#3D6A89] to-[#5AB3B6] hover:opacity-90 cursor-pointer",
          className
        )}
      >
        {iconLeft && <span>{iconLeft}</span>}
        <span className="truncate">{children}</span>
        {iconRight && <span>{iconRight}</span>}
      </button>
    );
  }
);

export default GradientButton;