import React, { useState, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange }) => {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const d = [...digits];
    d[i] = v.slice(-1);
    setDigits(d);
    onChange(d.join(""));
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const d = [...digits];
    pasted.split("").forEach((ch, i) => { d[i] = ch; });
    setDigits(d);
    onChange(d.join(""));
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-lg font-black rounded-xl border-2 outline-none transition-all ${
            digit
              ? "border-[#c9a84c] bg-[#c9a84c]/5 text-gray-900"
              : "border-gray-200 bg-gray-50 text-gray-900 focus:border-[#c9a84c]"
          }`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
