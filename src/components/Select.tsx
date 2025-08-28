// src/components/Select.tsx
import React, { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: React.ReactNode };

type Props = {
  value: string | null;                    // null = unassigned
  onChange: (v: string | null) => void;
  options: SelectOption[];
  placeholder?: string;                    // shown when value is null
  className?: string;
  buttonClassName?: string;
  listClassName?: string;
};

export const Select: React.FC<Props> = ({
  value, onChange, options,
  placeholder = "Select…",
  className = "relative inline-block w-56",
  buttonClassName = "w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white text-left flex items-center justify-between",
  listClassName = "absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded border border-gray-200 bg-white shadow",
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = value == null ? null : options.find(o => o.value === value) || null;

  // close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // keyboard support
  const move = (dir: 1 | -1) => {
    const last = options.length - 1;
    let next = activeIndex;
    next = next === -1 ? (dir === 1 ? 0 : last) : Math.min(last, Math.max(0, activeIndex + dir));
    setActiveIndex(next);
  };

  return (
    <div ref={rootRef} className={className}>
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen(o => !o);
          setActiveIndex(Math.max(0, options.findIndex(o => o.value === value)));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); if (!open) setOpen(true); move(1); }
          if (e.key === "ArrowUp") { e.preventDefault(); if (!open) setOpen(true); move(-1); }
          if (e.key === "Enter") {
            e.preventDefault();
            if (!open) { setOpen(true); return; }
            const opt = options[activeIndex];
            if (opt) { onChange(opt.value); setOpen(false); }
          }
          if (e.key === "Escape") { setOpen(false); }
        }}
      >
        <span className="truncate">{selected ? selected.label : <span className="text-gray-500">{placeholder}</span>}</span>
        <svg width="16" height="16" className="opacity-70" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.25 7.5l4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className={listClassName}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
            if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
            if (e.key === "Enter") {
              e.preventDefault();
              const opt = options[activeIndex];
              if (opt) { onChange(opt.value); setOpen(false); }
            }
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {/* Unassigned row */}
          <li
            role="option"
            aria-selected={value == null}
            className={`px-3 py-2 text-sm cursor-pointer ${value == null ? "bg-indigo-50" : "hover:bg-gray-100"}`}
            onMouseEnter={() => setActiveIndex(-1)}
            onClick={() => { onChange(null); setOpen(false); }}
          >
            <span className="text-gray-600">Unassigned</span>
          </li>

          {options.map((o, i) => {
            const isSel = o.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSel}
                className={`px-3 py-2 text-sm cursor-pointer ${isActive ? "bg-indigo-50" : "hover:bg-gray-100"}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
