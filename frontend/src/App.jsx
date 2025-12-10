import { useEffect, useState } from "react";

export default function App() {
  const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg" 
  ];
 
  //showing documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      setDocuments(data);
    } catch {
      setError("Failed to load documents");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    setMessage("");
    setError("");

    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if(!allowedTypes.includes(file.type)) {
      setError("Only PDF, PNG, and JPG files are allowed.");
      autoClearError();
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setMessage("File uploaded successfully");
      setError("");
      setFile(null);
      document.querySelector('input[type="file"]').value = null;
      fetchDocuments();
      autoClearMessage();
    } catch {
      setError("Network error or backend not running");
      autoClearError();
    }
  };
 //delete
  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/documents/${id}`, { method: "DELETE" });
    fetchDocuments();
  };

  const autoClearMessage = ()=>{
    setTimeout(() => setMessage(""), 4000);
  };
  const autoClearError = ()=>{
    setTimeout(() => setError(""), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex justify-center items-start py-12">
      <div className="w-full max-w-3xl bg-gray-850 shadow-xl rounded-xl p-8 border border-gray-700">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Patient Documents Portal
        </h1>

        {/* Upload Box */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg mb-6">
          <p className="text-lg font-semibold mb-3">Upload Document</p>

          <div className="flex items-center gap-3">
            <input
              type="file"
              className="text-white"
              onChange={(e) => {
                setMessage("");
                setError("");

                const selected = e.target.files[0];
                setFile(selected);
              }}
            />

            <button
              onClick={handleUpload}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg font-semibold"
            >
              Upload
            </button>
          </div>

          {message && (
            <p className="mt-3 text-green-400 font-medium">{message}</p>
          )}

          {error && (
            <p className="mt-3 text-red-400 font-medium">{error}</p>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">

          <p className="text-lg font-semibold mb-4">Uploaded Files</p>

          {documents.length === 0 ? (
            <p className="text-gray-400">No documents uploaded yet.</p>
          ) : (
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2">Filename</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-gray-800 hover:bg-gray-800"
                  >
                    
                      <td className="py-2 max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={doc.filename}
                      >
                        {doc.filename}
                    </td>

                    <td>{(doc.filesize / 1024).toFixed(1)} KB</td>
                    <td>{new Date(doc.created_at).toLocaleString()}</td>
                    <td>
                      <div className="flex gap-3">
                        <a
                          href={`${API_BASE}/documents/${doc.id}`}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md"
                        >
                          Download
                        </a>

                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Backend: {API_BASE}
        </p>
      </div>
    </div>
  );
}
