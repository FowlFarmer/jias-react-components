"use client";
import { useState } from "react";
// Types only – fixes no-explicit-any lint:
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";

export default function ResumeUploadToJson() {
  const [fileName, setFileName] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const pdfjsLib = await import("pdfjs-dist");

      // Worker URL as a string (not a module object)
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();

      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

      // If it might be >1 page, concatenate in order
      let allText = "";
      const numPages = pdf.numPages ?? 1;
      for (let p = 1; p <= numPages; p++) {
        const page = await pdf.getPage(p);
        const content: TextContent = await page.getTextContent();
        const pageText = content.items
          .map((it) => (isTextItem(it) ? it.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (pageText) allText += (allText ? "\n" : "") + pageText;
      }

      // Empty if scanned (image-only) – you'd add OCR here if needed
      const payload = { resume_body: allText };
      console.log("payload →", payload);

      const response = await fetch("/api/parse_resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("response", data);
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Resume parse/send failed:", err);
      alert("Failed to parse or send the resume. See console for details.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input type="file" accept="application/pdf" onChange={onFile} />
      {fileName && <small>Selected: {fileName}</small>}
    </div>
  );
}

// Type guard for PDF.js text items
function isTextItem(it: TextContent["items"][number]): it is TextItem {
  return typeof (it as TextItem).str === "string";
}