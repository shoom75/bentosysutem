"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getHistoryAction } from '@/actions';

import { ALL_BENTO_ITEMS } from '@/constants/bento';

interface HistoryRecord {
    id: string | number;
    bento: string;
    date: string;
    status: string;
}

const bentoImageMap: { [key: string]: string } = {
    "弁当A": "/hambagu.png",
    "弁当B": "/salmon.png",
    "弁当C": "/sushi.png",
    "弁当D": "/hambagu.png",
    "弁当E": "/salmon.png",
    "弁当F": "/sushi.png",
    "弁当G": "/hambagu.png",
};

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
    const pathname = usePathname();

    const toggleSidebar = () => setIsOpen(!isOpen);

    useEffect(() => {
        const fetchHistory = async () => {
            const userName = sessionStorage.getItem('userName');
            if (!userName) return;

            // 初回読み込み時にキャッシュから復元
            if (history.length === 0) {
                const cached = localStorage.getItem(`history_${userName}`);
                if (cached) {
                    try { setHistory(JSON.parse(cached)); } catch (e) { }
                }
            }

            if (history.length === 0) setIsLoading(true);

            try {
                const data = await getHistoryAction(userName);
                if (data.success) {
                    const newHistory = data.history || [];
                    setHistory(newHistory);
                    localStorage.setItem(`history_${userName}`, JSON.stringify(newHistory));
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 60000); // 1分おきに更新（負荷軽減）
        return () => clearInterval(interval);
    }, [pathname]);

    if (pathname?.toLowerCase() === '/login') return null;

    const getBentoDetails = (name: string) => {
        return ALL_BENTO_ITEMS.find(item => item.name === name);
    };

    // 履歴を日付ごとにグループ化する関数
    const groupedHistory = history.reduce((groups: { [key: string]: HistoryRecord[] }, item) => {
        const date = item.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
        return groups;
    }, {});

    // 今日から近い順にソート（絶対値で比較）
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sortedDates = Object.keys(groupedHistory).sort((a, b) => {
        const diffA = Math.abs(new Date(a).getTime() - now.getTime());
        const diffB = Math.abs(new Date(b).getTime() - now.getTime());
        return diffA - diffB;
    });

    return (
        <>
            <div className="lg:hidden flex justify-between items-center p-3 px-5 bg-white border-b border-[#eaeced] sticky top-0 z-[900]">
                <div className="flex items-center">
                    <button className="text-2xl cursor-pointer mr-4 text-[#2d3436]" onClick={toggleSidebar}>☰</button>
                    <span className="font-extrabold text-[#2d3436]">国際理工弁当予約</span>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[950] lg:hidden" onClick={toggleSidebar}></div>
            )}

            <aside className={`fixed lg:sticky top-0 left-0 w-[280px] bg-white border-r border-[#eaeced] h-screen flex flex-col z-[1000] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-[#eaeced]">
                    <Link href="/" className="no-underline" onClick={() => setIsOpen(false)}>
                        <h2 className="text-[1.4rem] font-bold text-[#d63031] m-0">国際理工弁当予約</h2>
                    </Link>
                </div>

                <div className="flex-grow overflow-y-auto p-4 pb-8 flex flex-col">
                    <span className="text-[0.75rem] font-black text-[#636e72] uppercase tracking-[1.5px] mb-4 block pl-1">予約履歴</span>

                    {isLoading && history.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-400">履歴を読み込み中...</div>
                    ) : history.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            {sortedDates.map((dateStr) => (
                                <div key={dateStr} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 mb-0 px-1">
                                        <span className="text-[0.8rem] font-black text-gray-800">
                                            {(() => {
                                                try {
                                                    const d = new Date(dateStr);
                                                    if (isNaN(d.getTime())) return dateStr;
                                                    return new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(d);
                                                } catch (e) { return dateStr; }
                                            })()}
                                        </span>
                                        <div className="h-[1px] flex-grow bg-gray-100"></div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3">
                                        {groupedHistory[dateStr].map((item, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => setSelectedHistory(item)}
                                                className="flex gap-3 p-3 rounded-2xl bg-white border border-[#eaeced] transition-all duration-200 hover:border-[#d63031] hover:shadow-md cursor-pointer active:scale-[0.98]"
                                            >
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                                                    <img 
                                                        src={bentoImageMap[item.bento] || "/hambagu.png"} 
                                                        alt={item.bento}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="font-bold text-[0.85rem] text-[#2d3436] truncate leading-tight">{item.bento}</span>
                                                        <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-bold border border-green-100 shrink-0 ml-1">
                                                            {item.status || '完了'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[0.65rem] font-medium text-gray-400">
                                                        予約完了
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">予約履歴がありません</div>
                    )}

                    <div className="mt-auto pt-8">
                        <button
                            onClick={() => {
                                const userName = sessionStorage.getItem('userName');
                                sessionStorage.clear();
                                if (userName) localStorage.removeItem(`history_${userName}`);
                                window.location.href = '/login';
                            }}
                            className="w-full flex items-center gap-3 text-[#636e72] text-[0.9rem] p-3.5 rounded-xl transition-all hover:bg-red-50 hover:text-[#d63031] border-none bg-transparent cursor-pointer font-bold"
                        >
                            <span className="text-lg">👤</span>
                            <span>ログアウト</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* 履歴詳細オーバーレイ */}
            {selectedHistory && (() => {
                const details = getBentoDetails(selectedHistory.bento);
                return (
                    <div className="fixed inset-0 z-[2500] flex items-end md:items-center justify-center p-0 md:p-4">
                        <div 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedHistory(null)}
                        ></div>
                        <div className="relative bg-white w-full max-w-[500px] rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300">
                            <div className="bg-[#2d3436] p-6 text-white text-center">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">注文詳細内容</span>
                                <h3 className="text-xl font-black">
                                    {(() => {
                                        try {
                                            const d = new Date(selectedHistory.date);
                                            if (isNaN(d.getTime())) return selectedHistory.date;
                                            return new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(d);
                                        } catch (e) { return selectedHistory.date; }
                                    })()} の予約
                                </h3>
                                <button 
                                    onClick={() => setSelectedHistory(null)}
                                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                                >✕</button>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-5 mb-6">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shrink-0 shadow-sm">
                                        <img 
                                            src={bentoImageMap[selectedHistory.bento] || "/hambagu.png"} 
                                            alt={selectedHistory.bento}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h4 className="text-lg font-black text-gray-800 mb-1">{selectedHistory.bento}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-[#d63031]">¥{details?.price.toLocaleString()}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-[10px] text-green-700 font-bold uppercase tracking-wider">Confirmed</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                                    <p className="text-[13px] text-gray-600 leading-relaxed italic">
                                        &ldquo;{details?.desc || "美味しく召し上がっていただけるお弁当です。"}&rdquo;
                                    </p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                        <span className="text-gray-400">注文ステータス</span>
                                        <span className="font-bold text-gray-700">{selectedHistory.status || '受取待ち'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                        <span className="text-gray-400">受取場所</span>
                                        <span className="font-bold text-gray-700">1F 受付カウンター</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedHistory(null)}
                                    className="w-full p-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}
