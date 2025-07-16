import React, { useState, useRef } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({
  children,
  content,
  side = 'top',
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    timeout.current = setTimeout(() => setIsVisible(true), 80);
  };
  const hide = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setIsVisible(false);
  };

  // Position classes
  const pos = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2"
  }[side];

  return (
    <div
      className="relative inline-flex items-center focus:outline-none"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby="tooltip"
    >
      {children}
      <div
        className={`pointer-events-none absolute z-50 px-3 py-1.5 rounded bg-gray-900 text-xs text-white shadow opacity-0 transition-opacity duration-150 ${
          isVisible ? "opacity-100" : ""
        } ${pos}`}
        role="tooltip"
        id="tooltip"
      >
        {content}
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${
            side === "top"
              ? "top-full border-x-4 border-x-transparent border-t-4 border-t-gray-900"
              : side === "bottom"
              ? "bottom-full border-x-4 border-x-transparent border-b-4 border-b-gray-900"
              : side === "left"
              ? "right-[-8px] top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-gray-900"
              : "left-[-8px] top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-gray-900"
          }`}
        />
      </div>
    </div>
  );
};
