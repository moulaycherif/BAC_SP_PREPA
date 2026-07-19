import { useState } from "react";

interface Props {
  url?: string;
}

const PdfViewer = ({ url }: Props) => {
  const [error, setError] = useState(false);

  if (!url) return null;

  return (
    <div className="bg-gray-100 py-10 flex justify-center">
      <div className="bg-white rounded-xl shadow-md w-full max-w-4xl overflow-hidden">

        {!error ? (
          <iframe
            src={`${url}#toolbar=0&navpanes=0&view=FitH`}
            className="w-full h-[85vh]"
            style={{
              border: "none",
              // transform: "scale(1.2)",     // 🔥 ZOOM
              transformOrigin: "top center"
            }}
            onError={() => setError(true)}
          />
        ) : (
          <div className="p-10 text-center text-red-500">
            ❌ Impossible de charger le PDF
          </div>
        )}

      </div>
    </div>
  );
};

export default PdfViewer;