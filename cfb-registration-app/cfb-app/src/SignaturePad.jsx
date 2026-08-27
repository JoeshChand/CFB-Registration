import React, { useRef, useEffect, useState } from "react";

/**
 * A real draw-to-sign pad (mouse or finger), not a typed name.
 * Calls onChange(blob, previewDataUrl) as the person draws, and
 * onChange(null, null) when cleared. The parent hangs on to the blob
 * and uploads it to storage on submit.
 */
export default function SignaturePad({ onChange, height = 130 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#101C33";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches && e.touches.length ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };

  const commit = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (blob) onChange(blob, canvas.toDataURL("image/png"));
    }, "image/png");
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    commit();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null, null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height, touchAction: "none" }}
        className="rounded-md border border-[#E3DECF] bg-white cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-[#B4AF9C]">
          {hasDrawn ? "Signed" : "Sign here with mouse or finger"}
        </span>
        <button type="button" onClick={clear} className="text-xs text-[#8A8570] hover:text-[#B33]">
          Clear
        </button>
      </div>
    </div>
  );
}
