"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, QrCode, Home, Check } from "lucide-react";

export default function SharePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollId = searchParams.get("pollId");
  
  const [copied, setCopied] = useState(false);
  const [pollLink, setPollLink] = useState("");

  useEffect(() => {
    if (pollId) {
      const link = `${window.location.origin}/poll/${pollId}`;
      setPollLink(link);
    }
  }, [pollId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pollLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pollId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No poll created</h1>
          <p className="text-gray-400 mb-6">Please create a poll first</p>
          <button
            onClick={() => router.push("/create")}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl font-semibold"
          >
            Create Poll
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Poll Created Successfully! 🎉
          </h1>
          <p className="text-gray-400 mt-2">Share this poll with your audience</p>
        </div>

        <div className="space-y-8">
          {/* Poll ID Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Poll ID</h2>
            <div className="flex items-center justify-center">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-wider">
                {pollId}
              </div>
            </div>
            <p className="text-gray-400 text-center mt-4">
              Participants can join using this ID
            </p>
          </div>

          {/* Share Link Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Copy className="w-6 h-6" />
              Shareable Link
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-gray-900 border border-gray-600 rounded-xl p-4 overflow-x-auto">
                <code className="text-green-400">{pollLink}</code>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <QrCode className="w-6 h-6" />
              QR Code
            </h2>
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-2xl mb-6">
                {/* Placeholder for QR Code - You can use a QR code library like qrcode.react */}
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-xl">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-gray-600 text-sm">QR Code for {pollId}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-center">
                Scan to join the poll
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center mt-12">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl border border-gray-700 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Home className="w-6 h-6" />
              <span className="text-lg font-semibold">Return to Dashboard</span>
            </button>
            
            <button
              onClick={() => router.push(`/poll/${pollId}`)}
              className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-green-500/25"
            >
              <span className="text-lg font-semibold">Go to Poll Manager</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-12 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
            <h4 className="font-semibold text-lg mb-4">How to use your poll:</h4>
            <ul className="text-gray-400 space-y-3 list-disc pl-5">
              <li>Share the Poll ID or link with your participants</li>
              <li>Go to Poll Manager to start the live poll session</li>
              <li>Questions will be shown one at a time to participants</li>
              <li>You control when to advance to the next question</li>
              <li>Real-time results will be shown after each question</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}