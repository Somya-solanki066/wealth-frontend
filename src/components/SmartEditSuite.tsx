"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import PaywallModal from "@/components/ui/PaywallModal";

interface EditCheck {
  name: string;
  original: string;
  suggested: string;
  feedback: string;
}

interface AIResponse {
  overallScore: number;
  checks: EditCheck[];
}

export default function SmartEditSuite() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<AIResponse | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!text && !file) {
      setError("Please paste some text or upload a document.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      if (file) formData.append("file", file);
      if (user) formData.append("userId", user.uid);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/smart-edit`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      setResults(response.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.limitExceeded) {
        setShowPaywall(true);
      } else {
        setError(err.response?.data?.error || "Failed to analyze text. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Smart Edit Suite (AI)</h1>
        <p className="text-[#909090]">
          Analyze your text for grammar, pacing, repetition, and more using advanced AI.
        </p>
      </div>

      {!results ? (
        <div className="bg-[#161616] border border-[#242424] rounded-xl p-6 shadow-xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#C9A84C] mb-2">
                Paste your text here
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-48 bg-[#080808] border border-[#242424] rounded-lg p-4 text-white focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
                placeholder="Paste your chapter, article, or scene here..."
                disabled={loading}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-[#242424]"></div>
              <span className="text-[#909090] text-sm uppercase font-semibold">OR</span>
              <div className="flex-1 h-px bg-[#242424]"></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C9A84C] mb-2">
                Upload Document (DOCX, PDF, TXT)
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#242424] border-dashed rounded-lg cursor-pointer bg-[#080808] hover:bg-[#121212] transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-[#909090]" />
                    <p className="mb-2 text-sm text-[#909090]">
                      <span className="font-semibold text-white">Click to upload</span> or drag and drop
                    </p>
                    {file && <p className="text-[#C9A84C] text-sm font-medium">{file.name}</p>}
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-[#C9A84C] hover:bg-[#b0923e] text-[#080808] font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2" size={20} />
                    Analyze Text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          <div className="flex items-center justify-between bg-[#161616] border border-[#242424] rounded-xl p-6 shadow-xl">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Analysis Complete</h2>
              <p className="text-[#909090]">Review the suggestions below to improve your writing.</p>
            </div>
            <div className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-[#C9A84C] bg-[#080808] shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              <span className="text-4xl font-black text-[#C9A84C]">{results.overallScore}</span>
              <span className="text-xs font-semibold text-[#909090] uppercase tracking-wider mt-1">Score</span>
            </div>
          </div>

          <div className="grid gap-4">
            {results.checks.map((check, idx) => (
              <div
                key={idx}
                className="bg-[#161616] border border-[#242424] rounded-xl overflow-hidden transition-all duration-300"
              >
                <div
                  className="flex justify-between items-center p-5 cursor-pointer hover:bg-[#1a1a1a]"
                  onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#080808] rounded-lg border border-[#242424]">
                      <FileText size={18} className="text-[#C9A84C]" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">{check.name}</h3>
                  </div>
                  {expandedCard === idx ? (
                    <ChevronUp className="text-[#909090]" />
                  ) : (
                    <ChevronDown className="text-[#909090]" />
                  )}
                </div>

                {expandedCard === idx && (
                  <div className="p-5 pt-0 border-t border-[#242424] bg-[#0c0c0c] animate-fade-in">
                    <p className="text-sm text-[#909090] mb-6 italic">{check.feedback}</p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider px-2 py-1 bg-red-400/10 rounded border border-red-400/20">
                          Original
                        </span>
                        <div className="p-4 bg-[#161616] rounded-lg border border-[#242424] text-red-200/70 line-through">
                          {check.original || "No issues found."}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-green-400 uppercase tracking-wider px-2 py-1 bg-green-400/10 rounded border border-green-400/20">
                          Suggested
                        </span>
                        <div className="p-4 bg-[#161616] rounded-lg border border-[#C9A84C]/50 text-white shadow-[0_0_10px_rgba(201,168,76,0.1)]">
                          {check.suggested || "Looks good!"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                setResults(null);
                setExpandedCard(null);
                setFile(null);
              }}
              className="px-6 py-2 text-[#909090] hover:text-white transition-colors"
            >
              Analyze Another Text
            </button>
          </div>
        </div>
      )}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} featureName="Smart Edit Suite" />
    </div>
  );
}
