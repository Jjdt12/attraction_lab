import React, { useState } from 'react';
import { BookOpen, FileText, AlertTriangle } from 'lucide-react';

export function DocumentationViewer() {
  const [selectedDoc, setSelectedDoc] = useState<string>('manual');

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <BookOpen className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-white">Documentation</h3>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setSelectedDoc('manual')}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              selectedDoc === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileText className="h-4 w-4" />
            Operator Manual
          </button>
          <button
            onClick={() => setSelectedDoc('bulletins')}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              selectedDoc === 'bulletins'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Service Bulletins
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedDoc === 'manual' && (
          <iframe
            src="/docs/operator-manual.html"
            className="w-full h-full border-0"
            title="Operator Manual"
          />
        )}
        {selectedDoc === 'bulletins' && (
          <iframe
            src="/docs/service-bulletins.html"
            className="w-full h-full border-0"
            title="Service Bulletins"
          />
        )}
      </div>
    </div>
  );
}
