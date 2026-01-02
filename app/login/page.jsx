"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  Zap, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Clock,
  Smartphone,
  Lock
} from "lucide-react";

export default function Login() {
  const router = useRouter();

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Real-time Voting",
      description: "See votes come in live as participants respond instantly"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Unlimited Participants",
      description: "No limits on how many can join your polls"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Live Analytics",
      description: "Watch results update in real-time with beautiful charts"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Quick Setup",
      description: "Create and launch a poll in under 2 minutes"
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Mobile Friendly",
      description: "Works perfectly on any device, anywhere"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Secure & Private",
      description: "End-to-end secure, no data sharing with third parties"
    }
  ];

  return (
    <div className="min-h-screen bg-eggshell text-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent">
            Live Polls
          </h1>
          <p className="text-light-taupe mt-2">Interactive polling made simple</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
          {/* Left Column - Login Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-10 shadow-xl border border-silver-pink/30">
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-light-taupe/20 to-silver-pink/20 flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-light-taupe" />
              </div>
              <h2 className="text-3xl font-bold text-light-taupe mb-3">
                Welcome Back
              </h2>
              <p className="text-silver-pink">
                Sign in to create interactive polls and engage your audience
              </p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={login}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] text-eggshell font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-silver-pink/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/90 text-silver-pink">Why sign in?</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-light-taupe/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-light-taupe" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-light-taupe">Host Unlimited Polls</h4>
                    <p className="text-sm text-silver-pink mt-1">Create as many polls as you need for different events and audiences</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-light-taupe/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <BarChart3 className="w-4 h-4 text-light-taupe" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-light-taupe">Detailed Analytics</h4>
                    <p className="text-sm text-silver-pink mt-1">Get insights with comprehensive analytics and export options</p>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-silver-pink pt-4 border-t border-silver-pink/20">
                <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            </div>
          </div>

          {/* Right Column - Features Section */}
          <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-10 shadow-xl border border-silver-pink/30">
              <h2 className="text-3xl font-bold text-light-taupe mb-6">
                What You Can Do
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 hover:bg-light-taupe/5 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-light-taupe/20 to-silver-pink/20 flex items-center justify-center flex-shrink-0">
                      <div className="text-light-taupe">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-light-taupe">{feature.title}</h3>
                      <p className="text-sm text-silver-pink mt-1">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 border border-light-taupe/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-light-taupe mb-4">
                Perfect For
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Classrooms",
                  "Conferences",
                  "Team Meetings",
                  "Webinars",
                  "Events",
                  "Surveys"
                ].map((useCase, index) => (
                  <div 
                    key={index}
                    className="bg-white/80 text-light-taupe font-medium py-2 px-4 rounded-lg text-center text-sm hover:bg-white transition-colors"
                  >
                    {useCase}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-silver-pink text-sm">
              <p>Join thousands of hosts who engage millions of participants monthly</p>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-light-taupe">99%</div>
                  <div className="text-xs">Uptime</div>
                </div>
                <div className="h-8 w-px bg-silver-pink/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-light-taupe">24/7</div>
                  <div className="text-xs">Support</div>
                </div>
                <div className="h-8 w-px bg-silver-pink/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-light-taupe">100%</div>
                  <div className="text-xs">Secure</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}