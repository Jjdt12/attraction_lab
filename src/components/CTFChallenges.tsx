import { Trophy, CheckCircle2, Circle, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  order_index: number;
  completed: boolean;
}

interface CTFChallengesProps {
  sessionId: string | null;
}

export default function CTFChallenges({ sessionId }: CTFChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadChallenges();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      console.log('[CTF] Polling for challenge updates...');
      loadChallenges();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId]);

  const loadChallenges = async () => {
    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*')
      .order('order_index');

    if (!challengesData) return;

    if (sessionId) {
      const { data: completionsData } = await supabase
        .from('challenge_completions')
        .select('challenge_id')
        .eq('session_id', sessionId);

      console.log('[CTF] Completions data:', completionsData);

      const completedIds = new Set(completionsData?.map(c => c.challenge_id) || []);

      const enrichedChallenges = challengesData.map(challenge => ({
        ...challenge,
        completed: completedIds.has(challenge.id),
      }));

      console.log('[CTF] Enriched challenges:', enrichedChallenges);

      setChallenges(enrichedChallenges);

      const points = enrichedChallenges
        .filter(c => c.completed)
        .reduce((sum, c) => sum + c.points, 0);
      setTotalPoints(points);
    } else {
      setChallenges(challengesData.map(c => ({ ...c, completed: false })));
      setTotalPoints(0);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      case 'expert': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const totalChallenges = challenges.length;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">CTF Challenges</h3>
            <p className="text-sm text-slate-600">
              {completedCount}/{totalChallenges} completed
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-600">{totalPoints}</div>
          <div className="text-xs text-slate-500">points</div>
        </div>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`border rounded-xl p-4 transition-all ${
              challenge.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {challenge.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${
                    challenge.completed ? 'text-green-900' : 'text-slate-900'
                  }`}>
                    {challenge.title}
                  </h4>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <p className={`text-sm ${
                  challenge.completed ? 'text-green-700' : 'text-slate-600'
                }`}>
                  {challenge.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Target className="w-3 h-3" />
                    <span className="font-medium">{challenge.points} pts</span>
                  </div>
                  {challenge.completed && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!sessionId && (
        <div className="mt-4 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          Start a ride session to begin tracking challenge progress
        </div>
      )}
    </div>
  );
}
