import React, { useRef } from "react";

export function Badge({ n }) {
  return (
    <span
      style={{ fontFamily: "Teko, sans-serif", fontWeight: 600 }}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#101C33] text-[#E7B23A] text-lg leading-none"
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

export function SectionHeading({ step, title, sub }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span style={{ fontFamily: "Teko, sans-serif" }} className="text-[#C6931F] text-2xl font-semibold tracking-wide">
        {step}
      </span>
      <div>
        <h3 className="text-[#101C33] font-semibold text-lg leading-tight">{title}</h3>
        {sub && <p className="text-[#6B6656] text-sm mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#4A4636] mb-1 tracking-wide uppercase">
        {label} {required && <span className="text-[#C6931F]">*</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-[#E3DECF] bg-white px-3 py-2 text-sm text-[#17181D] placeholder:text-[#B4AF9C] focus:outline-none focus:ring-2 focus:ring-[#E7B23A] focus:border-transparent transition";

export function PhotoUpload({ preview, onChange, label = "Upload photo" }) {
  const inputRef = useRef(null);
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-16 h-16 rounded-md border border-dashed border-[#D8D2BE] bg-[#FBFAF6] overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#B4AF9C]">
            <path d="M4 7h3l2-2h6l2 2h3v13H4V7z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-medium text-[#101C33] border border-[#101C33] rounded px-2.5 py-1.5 hover:bg-[#101C33] hover:text-white transition"
        >
          {preview ? "Replace" : label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f, URL.createObjectURL(f));
          }}
        />
      </div>
    </div>
  );
}

export function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-[#E3DECF] px-4 py-3 flex-1 min-w-[120px]">
      <p className="text-[10px] uppercase tracking-wide text-[#B4AF9C]">{label}</p>
      <p style={{ fontFamily: "Teko, sans-serif" }} className="text-3xl font-semibold text-[#101C33] leading-none mt-1">
        {value}
      </p>
    </div>
  );
}
