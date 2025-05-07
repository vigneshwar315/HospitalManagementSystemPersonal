// 🌟 Premium GenAiSearch.jsx — AI Assistant Styled
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiUpload, FiSearch, FiAlertCircle } from "react-icons/fi";
import { IoMdMedical } from "react-icons/io";
import { MdOutlineSchedule, MdWarningAmber } from "react-icons/md";
import { searchMedicines } from "./genaiApi";
import "../index.css";

const GenAiSearch = () => {
  const { query } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState(location.state?.rawResults || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInitialSearch = async () => {
      if (!location.state?.rawResults && query) {
        setLoading(true);
        const res = await searchMedicines(query.split(",").map((q) => q.trim()));
        setLoading(false);
        if (res.success) {
          setResults(res.results);
          setError("");
        } else {
          setError(res.error);
        }
      }
    };
    fetchInitialSearch();
  }, [query, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    const res = await searchMedicines(searchInput.split(",").map((s) => s.trim()));
    setLoading(false);
    if (res.success) {
      setResults(res.results);
      setError("");
    } else {
      setError(res.error);
      setResults([]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.medicines) {
        setResults(data.medicines);
        setError("");
        setSearchInput("");
        navigate(`/search/${data.medicines[0].medicine}`, {
          replace: true,
          state: { rawResults: data.medicines },
        });
      } else {
        setError("No medicine names found in the PDF.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file.");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Sidebar - Added for premium look */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gradient-to-b from-primary to-secondary text-white">
          <div className="flex items-center justify-center h-16 px-4 border-b border-blue-400">
            <h1 className="text-xl font-bold">MediCare AI</h1>
          </div>
          <div className="flex flex-col flex-grow p-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              <button
                onClick={() => navigate("/")}
                className="flex items-center w-full px-4 py-3 text-white hover:bg-blue-600 rounded-lg transition-all"
              >
                <FiArrowLeft className="mr-3" />
                Back to Home
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              AI Medical Assistant
            </h2>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                <span>AI</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search Bar - Enhanced */}
          <form 
            onSubmit={handleSubmit} 
            className="mb-8 bg-white rounded-xl shadow-sm p-4"
          >
            <div className="flex items-center">
              <div className="relative flex-grow">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search medicines or upload prescription..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                title="Upload PDF"
                className="ml-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FiUpload className="text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="submit"
                className="ml-4 px-6 py-2 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors"
              >
                Ask AI
              </button>
            </div>
          </form>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow text-red-800">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-lg" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <section className="grid gap-6 fade-in">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-full bg-blue-100 text-primary">
                      <IoMdMedical className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{item.medicine}</h3>
                      <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>

                  {item.dosage && (
                    <div className="mb-4 flex items-center gap-3">
                      <MdOutlineSchedule className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Dosage</p>
                        <p className="text-sm text-gray-600">{item.dosage}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MdWarningAmber className="text-red-400" /> Side Effects
                      </h4>
                      <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                        {(item.sideEffects || ["None"]).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FiAlertCircle className="text-yellow-500" /> Precautions
                      </h4>
                      <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                        {(item.precautions || ["Consult your doctor"]).map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default GenAiSearch;