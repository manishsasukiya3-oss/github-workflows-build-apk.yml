import React, { useState } from 'react';
import { Award, Trophy, Medal, BarChart2, CheckCircle2, XCircle, TrendingUp, Users, Search } from 'lucide-react';
import { TestResult, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface LeaderboardViewProps {
  results: TestResult[];
  users: UserProfile[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ results, users }) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Compute stats per student
  const userStatsMap: Record<string, {
    userId: string;
    userName: string;
    userEmail: string;
    totalTests: number;
    totalMarks: number;
    obtainedMarks: number;
    highestScore: number;
    avgPercentage: number;
  }> = {};

  results.forEach((r) => {
    const key = r.userId || r.userEmail;
    if (!userStatsMap[key]) {
      userStatsMap[key] = {
        userId: r.userId,
        userName: r.userName || r.userEmail.split('@')[0],
        userEmail: r.userEmail,
        totalTests: 0,
        totalMarks: 0,
        obtainedMarks: 0,
        highestScore: 0,
        avgPercentage: 0,
      };
    }

    const stat = userStatsMap[key];
    stat.totalTests += 1;
    stat.totalMarks += r.totalMarks || 100;
    stat.obtainedMarks += r.score || 0;
    if (r.score > stat.highestScore) {
      stat.highestScore = r.score;
    }
  });

  // Convert map to array and compute percentage
  const leaderboardList = Object.values(userStatsMap).map((stat) => {
    const percentage = stat.totalMarks > 0 ? (stat.obtainedMarks / stat.totalMarks) * 100 : 0;
    return {
      ...stat,
      avgPercentage: parseFloat(percentage.toFixed(1)),
    };
  });

  // Sort descending by highestScore and avgPercentage
  leaderboardList.sort((a, b) => b.highestScore - a.highestScore || b.avgPercentage - a.avgPercentage);

  return (
    <div className="space-y-6">
      {/* Leaderboard Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-200 font-bold text-xs uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-amber-200" />
            <span>{t('leaderboardTag', 'રાજ્યકક્ષાનું રેન્કિંગ એનાલિટિક્સ')}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black">
            {t('leaderboardTitle', 'વિદ્યાર્થી ગુણવત્તા લીડરબોર્ડ')}
          </h2>
          <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-xl">
            ઓનલાઇન ટેસ્ટમાં મેળવેલ સર્વશ્રેષ્ઠ ગુણ અને સરેરાશ પ્રદર્શનના આધારે તમામ વિદ્યાર્થીઓનું રેન્કિંગ.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shrink-0">
          <Medal className="w-10 h-10 text-amber-300 animate-pulse" />
          <div>
            <span className="text-xs text-amber-200 block font-semibold">કુલ ટેસ્ટ આપનાર</span>
            <span className="text-2xl font-black text-white">{leaderboardList.length} વિદ્યાર્થીઓ</span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      {leaderboardList.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 md:gap-6 pt-2">
          {/* 2nd Place */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center flex flex-col items-center justify-end relative shadow-lg">
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 text-slate-300 font-black text-lg flex items-center justify-center mb-2 shadow">
              2
            </div>
            <h4 className="font-bold text-slate-200 text-xs md:text-sm truncate w-full">{leaderboardList[1].userName}</h4>
            <span className="text-amber-400 font-extrabold text-sm md:text-base mt-1">{leaderboardList[1].highestScore} ગુણ</span>
            <span className="text-[10px] text-slate-400">{leaderboardList[1].avgPercentage}% સરેરાશ</span>
          </div>

          {/* 1st Place */}
          <div className="bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-5 text-center flex flex-col items-center justify-end relative shadow-2xl -translate-y-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow uppercase tracking-wider">
              TOPPER 👑
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-500 border-2 border-amber-300 text-slate-950 font-black text-2xl flex items-center justify-center mb-2 shadow-lg">
              1
            </div>
            <h4 className="font-extrabold text-white text-sm md:text-base truncate w-full">{leaderboardList[0].userName}</h4>
            <span className="text-amber-300 font-black text-base md:text-xl mt-1">{leaderboardList[0].highestScore} ગુણ</span>
            <span className="text-xs text-amber-200 font-semibold">{leaderboardList[0].avgPercentage}% સરેરાશ</span>
          </div>

          {/* 3rd Place */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center flex flex-col items-center justify-end relative shadow-lg">
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-700 text-amber-600 font-black text-lg flex items-center justify-center mb-2 shadow">
              3
            </div>
            <h4 className="font-bold text-slate-200 text-xs md:text-sm truncate w-full">{leaderboardList[2].userName}</h4>
            <span className="text-amber-400 font-extrabold text-sm md:text-base mt-1">{leaderboardList[2].highestScore} ગુણ</span>
            <span className="text-[10px] text-slate-400">{leaderboardList[2].avgPercentage}% સરેરાશ</span>
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">સંપૂર્ણ પરિણામ યાદી (Leaderboard Rank)</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">કુલ {leaderboardList.length} રેકોર્ડ્સ</span>
        </div>

        {leaderboardList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">હજુ સુધી કોઈ મોક ટેસ્ટ સબમિટ થયેલ નથી.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">રેન્ક</th>
                  <th className="py-3 px-4">વિદ્યાર્થી નામ</th>
                  <th className="py-3 px-4 text-center">આપેલ ટેસ્ટ</th>
                  <th className="py-3 px-4 text-center">ઉચ્ચ ગુણ</th>
                  <th className="py-3 px-4 text-center">સરેરાશ સફળતા (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {leaderboardList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                        idx === 0 ? 'bg-amber-500 text-slate-950' :
                        idx === 1 ? 'bg-slate-300 text-slate-900' :
                        idx === 2 ? 'bg-amber-800 text-amber-100' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.userName}
                      <span className="block text-[10px] text-slate-400 font-normal">{item.userEmail}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-400">
                      {item.totalTests} ટેસ્ટ
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-amber-400 text-sm">
                      {item.highestScore}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(item.avgPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-emerald-400">{item.avgPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
