import React from 'react';
import { X, Mic, Sparkles, Flame, Globe, Palette, Laugh, CloudSun, Music, Timer, Camera } from 'lucide-react';
import { ThemeConfig } from '../types/assistant';

interface SparksModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
}

export const SparksModal: React.FC<SparksModalProps> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  const categories = [
    {
      title: 'বাংলা ও বাংলিশ আড্ডা (Bangla & Banter)',
      icon: <img src="/logo.png" className="w-4 h-4 rounded-full object-cover inline-block" alt="Roxie Logo" />,
      items: [
        '“রক্সি, কি খবর তোমার? আজকে তোমার মুড কেমন?”',
        '“সত্যি করে বলো তো, আমি দেখতে কেমন?”',
        '“আজকের জন্য একটা চরম অনুপ্রেরণামূলক ডায়লগ দাও!”',
        '“তুমি কি কেবলই এআই নাকি তোমার মধ্যেও ফিলিংস আছে?”',
      ],
    },
    {
      title: 'আবহাওয়া ও টাইম টুলস (Weather & Timer)',
      icon: <CloudSun className="w-4 h-4 text-amber-400" />,
      items: [
        '“ঢাকার বর্তমান আবহাওয়া কেমন? আজকে কি বৃষ্টি হবে?”',
        '“চট্টগ্রামের তাপমাত্রা কত এখন?”',
        '“রক্সি, আমার জন্য ৫ মিনিটের একটা টাইমার চালু করো।”',
        '“১০ মিনিটের কাজের টাইমার দাও, একটু ফোকাস করি।”',
      ],
    },
    {
      title: 'মিউজিক ও নোটপ্যাড (Lo-Fi Music & Notes)',
      icon: <Music className="w-4 h-4 text-purple-400" />,
      items: [
        '“একটা রিল্যাক্সিং লো-ফাই মিউজিক প্লে করো তো।”',
        '“মিউজিকের ভাইবটা সাইবারপাঙ্ক করে দাও।”',
        '“লিখে রাখো: কাল বিকাল ৪টায় জরুরি মিটিং আছে।”',
        '“নোট সেভ করো: বাজারে গেলে কফি আর চকলেট কিনতে হবে।”',
      ],
    },
    {
      title: 'ক্যামেরা ভিশন ও ব্রাউজার (Vision & Actions)',
      icon: <Camera className="w-4 h-4 text-cyan-400" />,
      items: [
        '“আমার ক্যামেরা অন করো, দেখো তো এই জিনিসটা কী?”',
        '“আমার শার্টের রঙটা কেমন লাগছে বলো তো?”',
        '“ইউটিউব ওপেন করে দাও, গান শুনবো।”',
        '“স্পটিফাই খুলে দাও তো জলদি!”',
        '“থিমটা নিয়ন পিংক বা সায়ান করে দাও!”',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-neutral-900/95 border border-white/15 rounded-3xl p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{
          boxShadow: `0 0 50px -10px ${theme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <div>
              <h2 className="text-lg font-bold">Banter Sparks (কথা শুরুর আইডিয়া)</h2>
              <p className="text-xs text-white/50">যেকোনো একটি বাংলায় বা ইংরেজিতে মুখে বলুন!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Cards */}
        <div className="space-y-5 py-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-white/70">
                {cat.icon}
                <span>{cat.title}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-start gap-2.5 text-xs text-white/90 leading-relaxed group cursor-default"
                  >
                    <Mic className="w-3.5 h-3.5 text-pink-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-medium font-sans">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-semibold text-sm transition-all text-white shadow-lg shadow-pink-500/25"
        >
          বুঝেছি, কথা বলি!
        </button>
      </div>
    </div>
  );
};
