import React from "react";
import { fileToGeminiPart } from "../services/geminiService";

/**
 * FileUploader (frontend-only)
 * - Renders nothing visible except via render-prop children
 * - Provides an `open()` function to trigger the native file picker
 * - Converts selected file to a Gemini part using fileToGeminiPart
 *
 * Props:
 * - accept: string of accepted mime/extensions (default text+images)
 * - maxBytes: size limit guard in bytes (default handled in fileToGeminiPart as 4MB)
 * - onSelect: ({ part, file, label }) => void
 * - onError: (message: string) => void
 * - children: ({ open, isProcessing, lastFileName }) => ReactNode
 */
export default function FileUploader({
  accept = ".txt,.md,.json,.csv,.png,.jpg,.jpeg",
  onSelect,
  onError,
  children,
}) {
  const inputRef = React.useRef(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [lastFileName, setLastFileName] = React.useState("");

  const open = React.useCallback(() => {
    if (inputRef.current) inputRef.current.click();
  }, []);

  const handleChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setIsProcessing(true);
    try {
      const part = await fileToGeminiPart(f);
      setLastFileName(f.name);
      onSelect && onSelect({ part, file: f, label: f.name });
    } catch (err) {
      console.error("FileUploader error:", err);
      onError && onError(err.message || "Could not process file");
    } finally {
      setIsProcessing(false);
      e.target.value = null;
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      {typeof children === "function"
        ? children({ open, isProcessing, lastFileName })
        : null}
    </>
  );
}
