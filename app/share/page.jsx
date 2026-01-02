"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, QrCode, Home, Check, Share2, Link as LinkIcon, Users, ArrowRight, ExternalLink, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function SharePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollId = searchParams.get("pollId");
  
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [pollLink, setPollLink] = useState("");

  useEffect(() => {
    if (pollId && typeof window !== "undefined") {
      const link = `${window.location.origin}/poll/${pollId}`;
      setPollLink(link);
    }
  }, [pollId]);

  const copyToClipboard = (text, type = "link") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!pollId) {
    return (
      <div className="min-h-screen bg-eggshell text-foreground flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-light-taupe/20 flex items-center justify-center mx-auto mb-6">
            <QrCode className="w-10 h-10 text-light-taupe" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-light-taupe">No poll created</h1>
          <p className="text-silver-pink mb-6">Please create a poll first to get sharing options</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard/create")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-6 py-3 rounded-xl font-semibold text-eggshell transition-all hover:scale-105"
            >
              Create Poll
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-6 py-3 rounded-xl text-light-taupe transition-colors hover:bg-white/50"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eggshell text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent">
            Poll Created Successfully! 🎉
          </h1>
          <p className="text-silver-pink mt-2 max-w-2xl mx-auto">
            Share this poll with your audience using the options below
          </p>
        </div>

        <div className="space-y-5 md:space-y-6">
          {/* Poll ID Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-silver-pink/30 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-light-taupe/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-light-taupe" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-light-taupe">Poll ID</h2>
                  <p className="text-sm text-silver-pink">Share this ID with participants</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(pollId, "id")}
                className="flex items-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-2.5 rounded-lg text-light-taupe transition-colors hover:bg-white/50 self-start sm:self-center"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-center py-3 md:py-4">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent tracking-wider font-mono">
                {pollId}
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-silver-pink">
                Participants can join by entering this ID at the homepage
              </p>
            </div>
          </div>

          {/* Share Link Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-silver-pink/30 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-light-taupe/20 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-light-taupe" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-light-taupe">Direct Link</h2>
                  <p className="text-sm text-silver-pink">Share this URL directly with participants</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(pollLink, "link")}
                className="flex items-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-4 py-2.5 rounded-lg font-semibold text-eggshell transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-white/50 border border-silver-pink/30 rounded-xl p-4 overflow-x-auto">
              <code className="text-sm md:text-base text-light-taupe break-all font-mono">
                {pollLink}
              </code>
            </div>
            <div className="mt-4">
              <p className="text-sm text-silver-pink">
                <span className="font-medium text-light-taupe">Pro tip:</span> Participants can simply click this link to join immediately
              </p>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-silver-pink/30 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-light-taupe/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-light-taupe" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-light-taupe">QR Code</h2>
                  <p className="text-sm text-silver-pink">Scan to join the poll</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 md:p-6 rounded-xl border border-silver-pink/20 shadow-sm mb-6">
                {pollLink && (
                  <QRCodeSVG 
                    value={pollLink}
                    size={200}
                    level="H"
                    includeMargin={true}
                    bgColor="#F4EBDC"
                    fgColor="#AB8B7A"
                    className="w-48 h-48 md:w-56 md:h-56"
                  />
                )}
              </div>
              <p className="text-center text-silver-pink max-w-md">
                <span className="font-medium text-light-taupe">Great for in-person events:</span> Display this QR code on screen for participants to scan and join instantly
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-6 py-3.5 rounded-xl text-light-taupe transition-colors hover:bg-white/50"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold">Return to Dashboard</span>
            </button>
            
            <button
              onClick={() => router.push(`/poll/${pollId}`)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-6 py-3.5 rounded-xl font-semibold text-eggshell transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-semibold">Go to Poll Manager</span>
            </button>
          </div>

          {/* Quick Stats & Instructions */}
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 border border-light-taupe/20 rounded-xl p-5">
              <h4 className="font-semibold text-light-taupe mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Sharing Options
              </h4>
              <ul className="text-silver-pink space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-light-taupe">1</span>
                  </div>
                  <span><span className="font-medium text-light-taupe">Poll ID:</span> Perfect for verbal sharing or on presentation slides</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-light-taupe">2</span>
                  </div>
                  <span><span className="font-medium text-light-taupe">Direct Link:</span> Best for email, chat, or social media sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-light-taupe">3</span>
                  </div>
                  <span><span className="font-medium text-light-taupe">QR Code:</span> Ideal for in-person events, conferences, or classrooms</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5">
              <h4 className="font-semibold text-light-taupe mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Next Steps
              </h4>
              <ul className="text-silver-pink space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Share one of the above options with your audience</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Go to Poll Manager to start the live session</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Questions will be shown one at a time to participants</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>You control when to activate voting and advance questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Real-time results will be available after each question</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-silver-pink/20 text-center">
            <p className="text-sm text-silver-pink">
              Your poll is ready to go! Share it with your audience and start engaging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );``
}