"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, defaultChecked, ...props }, ref) => {
    const [isOn, setIsOn] = React.useState<boolean>(
      (defaultChecked as boolean) || false
    );

    React.useEffect(() => {
      if (typeof checked === "boolean") setIsOn(checked);
    }, [checked]);

    return (
      <label
        className={cn(
          "inline-flex items-center cursor-pointer select-none",
          className
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={isOn}
          ref={ref}
          onChange={(e) => {
            setIsOn(e.target.checked);
            props.onChange?.(e);
          }}
          {...props}
        />
        <span
          className={cn(
            "relative h-6 w-10 rounded-full transition-colors",
            isOn ? "bg-emerald-600" : "bg-gray-300"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
              isOn && "translate-x-4"
            )}
          />
        </span>
      </label>
    );
  }
);
Switch.displayName = "Switch";

export default Switch;
