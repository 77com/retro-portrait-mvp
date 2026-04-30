import { useEffect, useRef, useState } from "react";
import "./App.css";
type ImageInfo = {
  width: number;
  height: number;
};

function Slider({
  label,
  value,
  setValue,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontSize: 14,
          color: "#cbd5e1",
        }}
      >
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

const clamp = (value: number, min = 0, max = 255) =>
  Math.min(max, Math.max(min, value));

const getContrastFactor = (contrast: number) =>
  (259 * (contrast + 255)) / (255 * (259 - contrast));

const fitSize = (
  width: number,
  height: number,
  maxWidth = 1600,
  maxHeight = 1400
) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

function applyVintageFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    contrast: number;
    grain: number;
    vignette: number;
    sepia: number;
    dust: number;
    scratches: number;
    filmTexture: number;
  }
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const contrastFactor = getContrastFactor(options.contrast);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      gray = contrastFactor * (gray - 128) + 128;

      const shadowFactor = 1 - gray / 255;

let noise =
  (Math.random() - 0.5) *
  options.grain *
  2 *
  (0.6 + Math.random() * 0.8);

noise *= 0.5 + shadowFactor * 1.5;

gray += noise;

      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalizedDist = dist / maxDist;
      const vignetteFactor = 1 - normalizedDist * options.vignette;

      gray *= Math.max(0.2, vignetteFactor);
      gray = clamp(gray);

      const sepiaStrength = options.sepia / 100;

const sepiaR = gray * 1.07;
const sepiaG = gray * 0.94;
const sepiaB = gray * 0.74;

data[index] = clamp(gray * (1 - sepiaStrength) + sepiaR * sepiaStrength);
data[index + 1] = clamp(gray * (1 - sepiaStrength) + sepiaG * sepiaStrength);
data[index + 2] = clamp(gray * (1 - sepiaStrength) + sepiaB * sepiaStrength);
    }
  }

  ctx.putImageData(imageData, 0, 0);
drawFilmTexture(ctx, width, height, options.filmTexture);
drawDust(ctx, width, height, options.dust);
drawScratches(ctx, width, height, options.scratches);
}

function drawDust(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) {
  const particles = Math.floor(amount * 8);

  for (let i = 0; i < particles; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    const radius = Math.random() * 2 + 0.5;
    const alpha = Math.random() * 0.3 + 0.1;
    const shade = Math.floor(210 + Math.random() * 40);

    ctx.beginPath();
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // мягкое свечение вокруг частицы
    if (Math.random() < 0.3) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha * 0.3})`;
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
function drawScratches(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) {
  if (amount <= 0) return;

  const scratchesCount = Math.floor(amount * 1.2);

  for (let i = 0; i < scratchesCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.9;

    const length = 40 + Math.random() * height * 0.45;
    const angle = (Math.random() - 0.5) * 0.12;
    const alpha = 0.08 + Math.random() * 0.18;
    const lineWidth = 0.5 + Math.random() * 1.1;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const segments = 3 + Math.floor(Math.random() * 5);
    let currentY = 0;

    for (let s = 0; s < segments; s++) {
      const segmentLength = length / segments;
      const gap = Math.random() * 8;

      if (Math.random() > 0.25) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 1.5, currentY);
        ctx.lineTo(
          (Math.random() - 0.5) * 2,
          currentY + segmentLength - gap
        );

        ctx.strokeStyle = `rgba(240,240,240,${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      currentY += segmentLength;
    }

    // редкая тёмная царапина рядом — выглядит живее
    if (Math.random() < 0.25) {
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(2 + Math.random() * 2, length * 0.6);
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.35})`;
      ctx.lineWidth = lineWidth * 0.7;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawFilmTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) {
  if (amount <= 0) return;

  const layers = Math.floor(amount / 4) + 1;

  for (let l = 0; l < layers; l++) {
    const blobs = Math.floor((width * height) / 50000);

    for (let i = 0; i < blobs; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;

      const radius = 80 + Math.random() * 180;

      const gradient = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      );

      const opacity =
  (0.02 + Math.random() * 0.05) *
  (0.5 + Math.random() * 0.8);
  const tone = Math.random() > 0.5 ? 255 : 0;

      gradient.addColorStop(0, `rgba(${tone},${tone},${tone},${opacity})`);
      gradient.addColorStop(1, `rgba(255,255,255,0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const PRESETS = {
  studio1930: {
    label: "1930s Studio",
    contrast: 20,
    grain: 6,
    vignette: 0.25,
    sepia: 20,
    dust: 2,
    scratches: 1,
    filmTexture: 4,
  },
  noir: {
    label: "Noir",
    contrast: 75,
    grain: 12,
    vignette: 0.6,
    sepia: 0,
    dust: 3,
    scratches: 2,
    filmTexture: 6,
  },
  newspaper: {
    label: "Newspaper",
    contrast: 45,
    grain: 30,
    vignette: 0.1,
    sepia: 0,
    dust: 6,
    scratches: 3,
    filmTexture: 10,
  },
  film1950: {
    label: "1950s Film",
    contrast: 30,
    grain: 10,
    vignette: 0.35,
    sepia: 25,
    dust: 4,
    scratches: 2,
    filmTexture: 7,
  },
  polaroid: {
    label: "Polaroid",
    contrast: 10,
    grain: 8,
    vignette: 0.15,
    sepia: 35,
    dust: 2,
    scratches: 0,
    filmTexture: 5,
  },
  archive: {
    label: "Old Archive",
    contrast: 25,
    grain: 14,
    vignette: 0.4,
    sepia: 55,
    dust: 8,
    scratches: 5,
    filmTexture: 12,
  },
  hardbw: {
    label: "Hard B&W",
    contrast: 90,
    grain: 4,
    vignette: 0.2,
    sepia: 0,
    dust: 1,
    scratches: 0,
    filmTexture: 3,
  },
};

export default function App() {
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const [contrast, setContrast] = useState(18);
  const [grain, setGrain] = useState(6);
  const [vignette, setVignette] = useState(0.22);
  const [sepia, setSepia] = useState(0);
  const [dust, setDust] = useState(0);
  const [scratches, setScratches] = useState(0);
  const [filmTexture, setFilmTexture] = useState(0);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compareValue, setCompareValue] = useState(50);
  const [isReady, setIsReady] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg">("png");

  const [isProcessing, setIsProcessing] = useState(false);
  const applyPreset = (
  presetKey: keyof typeof PRESETS,
  preset: (typeof PRESETS)[keyof typeof PRESETS]
) => {
  setIsProcessing(true);

  setActivePreset(presetKey);
  setContrast(preset.contrast);
  setGrain(preset.grain);
  setVignette(preset.vignette);
  setSepia(preset.sepia);
  setDust(preset.dust);
  setScratches(preset.scratches);
  setFilmTexture(preset.filmTexture);

  setTimeout(() => {

    setIsProcessing(false);

  }, 700);
};

  useEffect(() => {
    return () => {
      if (sourceUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  useEffect(() => {
    if (!sourceUrl || !processedCanvasRef.current) {
      setIsReady(false);
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled || !processedCanvasRef.current) return;

      originalImageRef.current = img;

      const fitted = fitSize(img.width, img.height);
      setImageInfo(fitted);

      const canvas = processedCanvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = fitted.width;
      canvas.height = fitted.height;

      ctx.clearRect(0, 0, fitted.width, fitted.height);
      ctx.drawImage(img, 0, 0, fitted.width, fitted.height);

      applyVintageFilters(ctx, fitted.width, fitted.height, {
        contrast,
        grain,
        vignette,
        sepia,
        dust,
        scratches,
        filmTexture,
      });

      setIsReady(true);
    };

    setTimeout(() => {
  setIsProcessing(false);
}, 700);

    img.src = sourceUrl;

    return () => {
      cancelled = true;
    };
  }, [sourceUrl, contrast, grain, vignette, sepia, dust, scratches, filmTexture]);

  useEffect(() => {
    if (!isReady || !displayCanvasRef.current || !processedCanvasRef.current || !originalImageRef.current || !imageInfo) {
      return;
    }

    const displayCanvas = displayCanvasRef.current;
    const processedCanvas = processedCanvasRef.current;
    const originalImage = originalImageRef.current;
    const ctx = displayCanvas.getContext("2d");

    if (!ctx) return;

    const { width, height } = imageInfo;
    const splitX = Math.round((compareValue / 100) * width);

    displayCanvas.width = width;
    displayCanvas.height = height;

    ctx.clearRect(0, 0, width, height);

    ctx.drawImage(originalImage, 0, 0, width, height);

    if (splitX > 0) {
      ctx.drawImage(
        processedCanvas,
        0,
        0,
        splitX,
        height,
        0,
        0,
        splitX,
        height
      );
    }

    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.stroke();
  }, [isReady, compareValue, imageInfo]);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

     setIsProcessing(true);

    if (sourceUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(sourceUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSourceUrl(objectUrl);
    setCompareValue(50);
    setIsReady(false);
  };

  const handleDownload = () => {
  const canvas = processedCanvasRef.current;
  if (!canvas) return;

  const link = document.createElement("a");

  if (downloadFormat === "jpg") {
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.download = "retro-photo-export.jpg";
  } else {
    link.href = canvas.toDataURL("image/png");
    link.download = "retro-photo-export.png";
  }

  link.click();
};

  const updateCompareFromClientX = (clientX: number) => {
    const container = compareRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = (x / rect.width) * 100;
    setCompareValue(Math.min(100, Math.max(0, percent)));
  };

  const handleMouseDown = (clientX?: number) => {
    if (typeof clientX === "number") {
      updateCompareFromClientX(clientX);
    }

    const handleMouseMove = (event: MouseEvent) => {
      updateCompareFromClientX(event.clientX);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="app-shell"
  style={{
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#0f172a",
  color: "white",
  padding: 0,
  overflow: "hidden",
  
}}
>
  <div
  className="editor-layout"
  style={{ flex: 1, display: "flex", minHeight: 0 }}
>
      {/* LEFT PANEL */}
      <div
      className="preview-panel"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 20,
          borderRight: "1px solid rgba(255,255,255,0.1)",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: window.innerWidth <= 768 ? 18 : 24, fontWeight: 700 }}>Preview Stage</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
              {imageInfo
                ? `${imageInfo.width} × ${imageInfo.height}`
                : "Upload an image"}
            </div>
          </div>

          {sourceUrl && (
            <div
  style={{
    display: "flex",
    gap: 8,
    flexShrink: 0,
  }}
>
  <select
    value={downloadFormat}
    onChange={(e) => setDownloadFormat(e.target.value as "png" | "jpg")}
    style={{
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #334155",
      background: "#1e293b",
      color: "white",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    <option value="png">PNG</option>
    <option value="jpg">JPG</option>
  </select>

  <button
    onClick={handleDownload}
    style={{
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: "#e2e8f0",
      color: "#0f172a",
      cursor: "pointer",
      fontWeight: 600,
      transition: "all 0.18s ease",
    }}
    onMouseEnter={(e) => {
  e.currentTarget.style.transform = "scale(1.03)";
  e.currentTarget.style.backgroundColor = "#f8fafc";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "scale(1)";
  e.currentTarget.style.backgroundColor = "#e2e8f0";
}}
  >
    Download
  </button>
</div>
          )}
        </div>

        <div
  className="image-drop-zone"
  style={{
    flex: 1,
    border: isDragging
  ? "2px dashed #93c5fd"
  : "2px dashed rgba(255,255,255,0.2)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: isDragging
  ? "#1e293b"
  : "transparent",
  boxShadow: isDragging
  ? "inset 0 0 0 1px #60a5fa, 0 0 30px #60a5fa33"
  : "none",
  transition: "all 0.2s ease",
  transform: isDragging ? "scale(1.02)" : "scale(1)",
            minHeight: 0,
            position: "relative",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >

{isProcessing && (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "#020617b8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      borderRadius: 16,
      backdropFilter: "blur(2px)",
    }}
  >
    <div
      style={{
        padding: "14px 22px",
        borderRadius: 14,
        background: "#0f172a",
        border: "1px solid #334155",
        color: "white",
        fontWeight: 600,
        fontSize: 15,
      }}
    >
      Processing...
    </div>
  </div>
)}

          {!sourceUrl ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
  {isDragging ? "Отпусти файл здесь" : "IMAGE AREA"}
</div>
              <div
                style={{
                  fontSize: 15,
                  color: "#94a3b8",
                  marginBottom: 20,
                  maxWidth: 420,
                  lineHeight: 1.6,
                }}
              >
                {isDragging
  ? "Мы готовы принять файл 👇"
  : "Drag and drop an image here or choose a file below."}
              </div>

              <label
                style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  borderRadius: 10,
                  background: "#e2e8f0",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            </div>
          ) : (
            <div
              ref={compareRef}
              style={{
                position: "relative",
                maxWidth: "100%",
                maxHeight: "100%",
                cursor: "ew-resize",
              }}
              onMouseDown={(e) => handleMouseDown(e.clientX)}
            >
              <canvas
                ref={displayCanvasRef}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  display: "block",
                }}
              />

              {compareValue > 3 && (
  <div
    style={{
      position: "absolute",
      top: 12,
      left: 12,
      padding: "6px 8px",
      borderRadius: 8,
      background: "rgba(0,0,0,0.6)",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      pointerEvents: "none",
    }}
  >
    Результат
  </div>
)}

{compareValue < 97 && (
  <div
    style={{
      position: "absolute",
      top: 12,
      right: 12,
      padding: "6px 8px",
      borderRadius: 8,
      background: "rgba(0,0,0,0.6)",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      pointerEvents: "none",
    }}
  >
    Оригинал
  </div>
)}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${compareValue}%`,
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 2,
height: "100%",
background: "#e2e8f0",
boxShadow: "0 0 12px #ffffff66",
                  }}
                >
                  <div
                    style={{
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#020617",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 700,
  boxShadow: "0 10px 30px #00000080",
}}
                  >
                    ↔
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <label
          style={{
            marginTop: 16,
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#1e293b",
            color: "white",
            cursor: "pointer",
            textAlign: "center",
            display: "inline-block",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
  e.currentTarget.style.transform = "scale(1.01)";
  e.currentTarget.style.backgroundColor = "#334155";
}}
          onMouseLeave={(e) => {
  e.currentTarget.style.transform = "scale(1)";
  e.currentTarget.style.backgroundColor = "#1e293b";
}}
        >
          Upload Again
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>


      </div>

      {/* RIGHT PANEL */}
      <div
      className="controls-panel"
        style={{
          width: 320,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ fontSize: window.innerWidth <= 768 ? 18 : 22, margin: 0 }}>
  Controls
</h2>

<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
  <div style={{ fontSize: 14, color: "#cbd5e1" }}>Presets</div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
    }}
  >
    {Object.entries(PRESETS).map(([key, preset]) => {
  const isActive = activePreset === key;

  return (
    <button
      key={preset.label}
      onClick={() => applyPreset(key as keyof typeof PRESETS, preset)}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: isActive
          ? "1px solid rgba(255,255,255,0.28)"
          : "1px solid rgba(255,255,255,0.08)",
        background: isActive ? "#e2e8f0" : "#1e293b",
        color: isActive ? "#0f172a" : "white",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        boxShadow: isActive ? "0 0 0 1px rgba(255,255,255,0.08) inset" : "none",
        transition: "all 0.18s ease",
      }}
    >
      {preset.label}
    </button>
  );
})}
  </div>
  
  <div style={{ marginTop: 10 }}>
  <button
    onClick={() => {
      setActivePreset(null);
      setContrast(0);
      setGrain(0);
      setVignette(0);
      setSepia(0);
      setDust(0);
      setScratches(0);
      setFilmTexture(0);
    }}
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #334155",
      backgroundColor: "transparent",
      color: "#cbd5e1",
      cursor: "pointer",
      fontSize: 13,
      transition: "all 0.18s ease",
    }}
    onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = "#1e293b";
  e.currentTarget.style.transform = "scale(1.01)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = "transparent";
  e.currentTarget.style.transform = "scale(1)";
}}
  >
    Reset
  </button>
</div>

</div>

        <Slider
  label="Контраст"
  value={contrast}
  setValue={(v) => {
    setActivePreset(null);
    setContrast(v);
  }}
  min={-100}
  max={100}
/>
        <Slider
  label="Зерно"
  value={grain}
  setValue={(v) => {
    setActivePreset(null);
    setGrain(v);
  }}
  min={0}
  max={40}
/>
        <Slider
  label="Виньетка"
  value={vignette}
  setValue={(v) => {
    setActivePreset(null);
    setVignette(v);
  }}
  min={0}
  max={1}
  step={0.01}
/>
        <Slider
  label="Сепия"
  value={sepia}
  setValue={(v) => {
    setActivePreset(null);
    setSepia(v);
  }}
  min={0}
  max={100}
/>
        <Slider
  label="Пыль"
  value={dust}
  setValue={(v) => {
    setActivePreset(null);
    setDust(v);
  }}
  min={0}
  max={20}
/>
        <Slider
  label="Царапины"
  value={scratches}
  setValue={(v) => {
    setActivePreset(null);
    setScratches(v);
  }}
  min={0}
  max={10}
/>
        <Slider
  label="Текстура"
  value={filmTexture}
  setValue={(v) => {
    setActivePreset(null);
    setFilmTexture(v);
  }}
  min={0}
  max={20}
/>
      </div>
</div>

{/* FOOTER будет здесь */}
<div
  style={{
    marginTop: 28,
    padding: "20px 28px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: "0.04em",
    flexShrink: 0,
  }}
>
  <div
    style={{
      cursor: "pointer",
      transition: "all 0.18s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = "rgba(255,255,255,0.85)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
    }}
  >
    <a
  href="https://sibashvili.com/"
  style={{ color: "#94a3b8", textDecoration: "none" }}
>
    ← Back
    </a>

  </div>

  <div
    style={{
      fontSize: 12,
      opacity: 0.7,
    }}
  >
    Crafted for timeless portraits
  </div>

  <div
    style={{
      cursor: "pointer",
      transition: "all 0.18s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = "rgba(255,255,255,0.85)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
    }}
  >

    <a
  href="https://sibashvili.com/contact.html"
  style={{ color: "#94a3b8", textDecoration: "none" }}
>
    Contacts
</a>

  </div>
</div>

      <canvas ref={processedCanvasRef} style={{ display: "none" }} />
    </div>
  );
}