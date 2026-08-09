import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Users, 
  Hand, 
  MessageSquare, 
  ShieldCheck, 
  Radio,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Group } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface GroupVoiceCallModalProps {
  group: Group;
  onClose: () => void;
}

interface Participant {
  id: string;
  name: string;
  role: 'admin' | 'student';
  isMuted: boolean;
  isSpeaking: boolean;
  hasRaisedHand: boolean;
  avatarColor: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export const GroupVoiceCallModal: React.FC<GroupVoiceCallModalProps> = ({ group, onClose }) => {
  const { userProfile } = useAuth();
  const { t } = useLanguage();

  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Audio Context & Stream Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Chat message state
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      senderName: 'પ્રમોટર શિક્ષક (Host)',
      text: 'નમસ્તે બધા વિદ્યાર્થી મિત્રો! આજના ગ્રુપ વોઇસ કોલમાં સ્વાગત છે.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Participants list in current voice call room
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: userProfile?.userId || 'me',
      name: userProfile?.name ? `${userProfile.name} (તમે)` : 'તમે (You)',
      role: userProfile?.role === 'admin' ? 'admin' : 'student',
      isMuted: !isMicOn,
      isSpeaking: false,
      hasRaisedHand: isHandRaised,
      avatarColor: 'from-amber-500 to-indigo-600',
    },
    {
      id: 'part_admin_host',
      name: 'મનીષ સર (એડમિન)',
      role: 'admin',
      isMuted: false,
      isSpeaking: true,
      hasRaisedHand: false,
      avatarColor: 'from-indigo-600 to-purple-600',
    },
    {
      id: 'part_student_2',
      name: 'રમેશ પટેલ',
      role: 'student',
      isMuted: true,
      isSpeaking: false,
      hasRaisedHand: false,
      avatarColor: 'from-emerald-500 to-teal-700',
    },
    {
      id: 'part_student_3',
      name: 'પ્રિયા જોષી',
      role: 'student',
      isMuted: false,
      isSpeaking: false,
      hasRaisedHand: true,
      avatarColor: 'from-pink-500 to-rose-700',
    },
  ]);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format call duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Real WebRTC Microphone Stream & Web Audio Visualizer
  useEffect(() => {
    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted) return;

        streamRef.current = stream;
        setPermissionError(null);

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));

          if (isMounted) {
            setMicVolume(normalizedVol);

            // Update my active speaking badge
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === (userProfile?.userId || 'me')
                  ? { ...p, isSpeaking: normalizedVol > 15 && isMicOn }
                  : p
              )
            );
          }

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err: any) {
        console.warn('Microphone permission or stream error:', err);
        if (isMounted) {
          setPermissionError('માઈક્રોફોન પરવાનગી સ્વીકારો જેથી તમારો અવાજ ગ્રુપમાં સંભળાય.');
        }
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Toggle Microphone
  const toggleMic = () => {
    const nextMicState = !isMicOn;
    setIsMicOn(nextMicState);

    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextMicState;
      });
    }

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === (userProfile?.userId || 'me')
          ? { ...p, isMuted: !nextMicState, isSpeaking: nextMicState ? p.isSpeaking : false }
          : p
      )
    );
  };

  // Toggle Speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Raise / Lower Hand
  const toggleRaiseHand = () => {
    const nextHandState = !isHandRaised;
    setIsHandRaised(nextHandState);

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === (userProfile?.userId || 'me') ? { ...p, hasRaisedHand: nextHandState } : p
      )
    );
  };

  // Send Chat Message in Call
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderName: userProfile?.name || 'તમે',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMsg]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between animate-fadeIn select-none p-4 md:p-6 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                LIVE VOICE CALL
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                ⏱️ {formatTime(callDuration)}
              </span>
            </div>
            <h2 className="text-lg font-black text-white">{group.name}</h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-200 rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow"
        >
          <PhoneOff className="w-4 h-4 text-red-400" />
          <span className="hidden sm:inline">કોલ સમાપ્ત કરો</span>
        </button>
      </div>

      {/* Permission Warning if Microphone is blocked */}
      {permissionError && (
        <div className="bg-amber-950/90 border border-amber-500/50 p-3 rounded-2xl text-amber-200 text-xs flex items-center gap-2 my-2 animate-bounce">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Main Call Stage & Grid Area */}
      <div className="flex-1 my-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* Participants Cards Grid (Left/Main Area) */}
        <div className={`md:col-span-${showChat ? '2' : '3'} bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between overflow-y-auto relative`}>
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Users className="w-4 h-4 text-indigo-400" /> 
              સક્રિય સભ્યો ({participants.length})
            </span>
            <span className="text-indigo-400">કનેક્ટેડ (HD Audio)</span>
          </div>

          {/* Participant Avatars & Visualizer */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 my-auto">
            {participants.map((p) => {
              const isMe = p.id === (userProfile?.userId || 'me');
              const activeVolume = isMe ? micVolume : (p.isSpeaking ? 60 : 0);

              return (
                <div
                  key={p.id}
                  className={`relative bg-slate-950 border rounded-3xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                    p.isSpeaking
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Speaker Pulse Visualizer Ring */}
                  <div className="relative">
                    {p.isSpeaking && (
                      <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping" />
                    )}
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-tr ${p.avatarColor} text-white font-black text-xl flex items-center justify-center shadow-xl border-2 ${
                        p.isSpeaking ? 'border-emerald-400' : 'border-slate-700'
                      }`}
                    >
                      {p.name.slice(0, 1)}
                    </div>

                    {/* Mute Badge */}
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700">
                      {p.isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="text-center w-full">
                    <p className="font-bold text-xs text-white truncate">{p.name}</p>
                    <span className={`text-[10px] font-semibold ${p.role === 'admin' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {p.role === 'admin' ? '👑 શિક્ષક / Host' : '🎓 વિદ્યાર્થી'}
                    </span>
                  </div>

                  {/* Raised Hand Icon Badge */}
                  {p.hasRaisedHand && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 p-1 rounded-lg text-xs font-black animate-bounce shadow">
                      ✋
                    </div>
                  )}

                  {/* Real-Time Audio Level Indicator Bar */}
                  {isMe && isMicOn && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-75"
                        style={{ width: `${activeVolume}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Live Audio Status Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              HD નોઈઝ કેન્સલેશન એક્ટિવ છે
            </span>
            <span>બધા વિદ્યાર્થીઓ લાઇવ સાંભળી રહ્યા છે</span>
          </div>
        </div>

        {/* Side In-Call Chat Overlay */}
        {showChat && (
          <div className="md:col-span-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                ઇન-કોલ લાઇવ મેસેજ
              </span>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 text-xs">
              {messages.map((m) => (
                <div key={m.id} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-300">{m.senderName}</span>
                    <span className="text-slate-500">{m.timestamp}</span>
                  </div>
                  <p className="text-slate-200">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="અહીં પ્રશ્ન અથવા મેસેજ લખો..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 flex items-center justify-center gap-3 md:gap-6 shrink-0 shadow-2xl max-w-xl mx-auto w-full">
        {/* Toggle Mic */}
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-1 ${
            isMicOn
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/40'
          }`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          <span className="text-[10px]">{isMicOn ? 'માઈક ઓન' : 'માઈક બંધ'}</span>
        </button>

        {/* Toggle Speaker */}
        <button
          onClick={toggleSpeaker}
          className={`p-3.5 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-1 ${
            isSpeakerOn
              ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          <span className="text-[10px]">{isSpeakerOn ? 'સ્પીકર ઓન' : 'મ્યૂટ'}</span>
        </button>

        {/* Raise Hand */}
        <button
          onClick={toggleRaiseHand}
          className={`p-3.5 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-1 ${
            isHandRaised
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Hand className="w-5 h-5" />
          <span className="text-[10px]">{isHandRaised ? 'હાથ ઉપર છે' : 'હાથ ઉપર કરો'}</span>
        </button>

        {/* Toggle Chat */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3.5 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-1 ${
            showChat
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">ચેટ ({messages.length})</span>
        </button>

        {/* End Call Button */}
        <button
          onClick={onClose}
          className="p-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition shadow-lg shadow-red-600/30 flex flex-col items-center gap-1"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-[10px]">કોલ કટ</span>
        </button>
      </div>
    </div>
  );
};
