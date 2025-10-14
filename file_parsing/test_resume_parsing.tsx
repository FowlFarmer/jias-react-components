"use client";
import { useState } from "react";

export default function ResumeUploadToJson() {
  const [fileName, setFileName] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // Load pdf.js only in the browser
    const pdfjsLib = await import("pdfjs-dist");

    // ✅ Provide a STRING URL for the worker
    // Turbopack/webpack will turn this into a proper public URL at runtime.
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();

    const text = content.items
      .map((it: any) => ("str" in it ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log({ resume_body: text });
    const response = await fetch("/api/parse_resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_body: text }),
    });
    const data = await response.json();
    console.log("response", data);
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input type="file" accept="application/pdf" onChange={onFile} />
      {fileName && <small>Selected: {fileName}</small>}
    </div>
  );
}