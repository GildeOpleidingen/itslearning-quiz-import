"use client";

import { useState, useCallback, useRef } from "react";
import { parseCsv } from "@/lib/csv-parser";
import { generateQtiZip } from "@/lib/qti-generator";

type Status =
  | { type: "idle" }
  | { type: "processing"; fileName: string }
  | { type: "done"; fileName: string; questionCount: number }
  | { type: "error"; message: string };

export default function Home() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const baseName = file.name.replace(/\.csv$/i, "");
    setStatus({ type: "processing", fileName: file.name });

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length === 0) {
        setStatus({ type: "error", message: "CSV bevat geen vragen." });
        return;
      }

      const blob = await generateQtiZip(rows);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}_xml.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ type: "done", fileName: file.name, questionCount: rows.length });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Onbekende fout",
      });
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.toLowerCase().endsWith(".csv")) {
        processFile(file);
      } else {
        setStatus({ type: "error", message: "Selecteer een .csv bestand." });
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so the same file can be selected again
      e.target.value = "";
    },
    [processFile]
  );

  const handleClick = () => inputRef.current?.click();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          CSV naar QTI Converter
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Converteer meerkeuzevragen naar QTI 2.1 voor itslearning
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${
              dragOver
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="mb-4">
            <svg
              className={`mx-auto h-12 w-12 transition-colors ${dragOver ? "text-blue-500" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>

          <p className="text-lg font-medium text-gray-700">
            Sleep je CSV bestand hierheen
          </p>
          <p className="text-sm text-gray-500 mt-1">
            of klik om een bestand te selecteren
          </p>
        </div>

        {/* Status messages */}
        {status.type === "processing" && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
            <svg
              className="h-5 w-5 text-blue-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-blue-800">
              Bezig met converteren van <strong>{status.fileName}</strong>...
            </span>
          </div>
        )}

        {status.type === "done" && (
          <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-green-800">
                <strong>{status.questionCount} vragen</strong> succesvol
                geconverteerd. Download is gestart.
              </span>
            </div>
          </div>
        )}

        {status.type === "error" && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <span className="text-red-800 whitespace-pre-wrap">
                {status.message}
              </span>
            </div>
          </div>
        )}

        {/* Format info */}
        <div className="mt-8 rounded-xl bg-gray-100 p-5 text-sm text-gray-600">
          <p className="font-semibold text-gray-700 mb-2">
            Verwacht CSV formaat:
          </p>
          <code className="block bg-white rounded-lg p-3 text-xs overflow-x-auto whitespace-pre">
            Volgnummer,Vraag,Antwoord A,Antwoord B,Antwoord C,Antwoord D,Juist
            {"\n"}1,Wat is 1+1?,1,2,3,4,B
          </code>
          <p className="mt-3 text-gray-500">
            Kolom <strong>Juist</strong> bevat het correcte antwoord: A, B, C of
            D.
            <br />
            Komma en puntkomma als scheidingsteken worden beide ondersteund.
          </p>
        </div>
      </div>
    </div>
  );
}
