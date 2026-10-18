import type { ReactNode } from "react";
import { buttonClasses, type ButtonColor } from "./buttonClasses";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  color?: ButtonColor;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export default function Button({
  children,
  onClick,
  className,
  color = "light",
  href,
  type = "button",
  disabled,
}: Props) {
  const classes = buttonClasses(color, className);

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
