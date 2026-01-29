import React from "react";
import clsx from "clsx";

interface ButtonProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "mid"; // Available button sizes
  disabled?: boolean;
  className?: string; // Custom class for extra styling
  iconLeft?: React.ReactNode; // left-side icon
  iconRight?: React.ReactNode; // right-side icon
  onClick?: () => void;
}

export default function WhiteButton({
  children,
  size = "xl",
  className,
  iconLeft,
  iconRight,
  onClick,
}: ButtonProps) {
  // Define width, height, and text size for each button size
  const sizeClasses = {
    sm: "w-24 h-6 text-[10px]",
    md: "w-30 h-8 text-[14px]",
    mid: "w-30 h-10 text-[14px]",
    lg: "w-40 h-8 text-[14px]",
    xl: "w-40 h-10 text-[16px]",
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        "border-2 hover:opacity-90 cursor-pointer text-[#33726D] rounded-[8px] font-semibold flex items-center justify-center gap-1 transition duration-200",
        sizeClasses[size],
        className
      )}
    >
      {iconLeft && <span>{iconLeft}</span>}
      <span className="truncate">{children}</span>
      {iconRight && <span>{iconRight}</span>}
    </button>
  );
}
