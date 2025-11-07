import { Trophy, X, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FlagCaptureNotificationProps {
  challengeTitle: string;
  points: number;
  onClose: () => void;
}

export default function FlagCaptureNotification({ challengeTitle, points, onClose }: FlagCaptureNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}
    >
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-2xl border-2 border-green-400 overflow-hidden min-w-[380px]">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

          <div className="relative px-6 py-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center animate-bounce">
                  <Trophy className="w-7 h-7 text-yellow-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-200" />
                    <h3 className="text-lg font-bold">Challenge Complete!</h3>
                  </div>
                  <p className="text-sm text-green-100">Flag captured successfully</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-3 mt-3">
              <p className="font-semibold text-white mb-1">{challengeTitle}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-300">+{points}</span>
                <span className="text-sm text-green-100">points earned</span>
              </div>
            </div>
          </div>

          <div className="h-1 bg-gradient-to-r from-yellow-300 via-green-300 to-emerald-400"></div>
        </div>
      </div>
    </div>
  );
}
