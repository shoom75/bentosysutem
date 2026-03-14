"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// actionsから型(HistoryRecord)もインポートする
import { getHistoryAction, type HistoryRecord } from '@/actions';
import { ALL_BENTO_ITEMS } from '@/constants/bento';

const bentoImageMap: { [key: string]: string } = {
    "弁当A": "/hambagu.png", "弁当B": "/salmon.png", "弁当C": "/sushi.png",
    "弁当D": "/hambagu.png", "弁当E": "/salmon.png", "弁当F": "/sushi.png",
    "弁当G": "/hambagu.png",
};

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryRecord[]>([]); // ここで型を使用
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
    const pathname = usePathname();

    const buildingStyles: { [key: string]: { bg: string, text: string, label: string } } = {
        '1': { bg: 'bg-blue-600', text: 'text-blue-600', label: '1号館受取' },
        '2': { bg: 'bg-red-600', text: 'text-red-600', label: '2号館受取' },
        '3': { bg: 'bg-green-600', text: 'text-green-600', label: '3号館受取' },
        'default': { bg: 'bg-[#2d3436]', text: 'text-gray-700', label: '1F 受付カウンター' }
    };

    const toggleSidebar = () => setIsOpen(!isOpen);

    useEffect(() => {
        const fetchHistory = async () => {
            const userId = sessionStorage.getItem('userId');
            const userName = sessionStorage.getItem('userName');
            if (!userId) return;

            if (history.length === 0) {
                const cached = localStorage.getItem(`history_${userName}`);
                if (cached) {
                    try { setHistory(JSON.parse(cached)); } catch (e) { }
                }
            }

            if (history.length === 0) setIsLoading(true);

            try {
                const data = await getHistoryAction(userId);
                if (data.success) {
                    setHistory(data.history); // 型が一致しているのでエラーが消える
                    localStorage.setItem(`history_${userName}`, JSON.stringify(data.history));
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [pathname]);

    if (pathname?.toLowerCase() === '/login') return null;

    const getBentoDetails = (name: string) => ALL_BENTO_ITEMS.find(item => item.name === name);

    const groupedHistory = history.reduce((groups: { [key: string]: HistoryRecord[] }, item) => {
        const date = item.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(item);
        return groups;
    }, {});

    const sortedDates = Object.keys(groupedHistory).sort((a, b) => 
        Math.abs(new Date(a).getTime() - Date.now()) - Math.abs(new Date(b).getTime() - Date.now())
    );

    return (
        <>
            <div className="lg:hidden flex justify-between items-center p-3 px-5 bg-white border-b border-[#eaeced] sticky top-0 z-[900]">
                <div className="flex items-center">
                    <button className="text-2xl cursor-pointer mr-4 text-[#2d3436]" onClick={toggleSidebar}>☰</button>
                    <span className="font-extrabold text-[#2d3436]">国際理工弁当予約</span>
                </div>
            </div>

            {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[950] lg:hidden" onClick={toggleSidebar}></div>}

            <aside className={`fixed lg:sticky top-0 left-0 w-[280px] bg-white border-r border-[#eaeced] h-screen flex flex-col z-[1000] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-[#eaeced]">
                    <Link href="/" className="no-underline" onClick={() => setIsOpen(false)}>
                        <h2 className="text-[1.4rem] font-bold text-[#d63031] m-0">国際理工弁当予約</h2>
                    </Link>
                </div>

                <div className="flex-grow overflow-y-auto p-4 pb-8 flex flex-col">
                    <span className="text-[0.75rem] font-black text-[#636e72] uppercase tracking-[1.5px] mb-4 block pl-1">予約履歴</span>
                    {isLoading && history.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-400">読み込み中...</div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {sortedDates.map((dateStr) => (
                                <div key={dateStr} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 mb-0 px-1">
                                        <span className="text-[0.8rem] font-black text-gray-800">
                                            {new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(dateStr))}
                                        </span>
                                        <div className="h-[1px] flex-grow bg-gray-100"></div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {groupedHistory[dateStr].map((item, idx) => (
                                            <div key={idx} onClick={() => setSelectedHistory(item)} className="flex gap-3 p-3 rounded-2xl bg-white border border-[#eaeced] hover:border-[#d63031] cursor-pointer">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                                    <img src={bentoImageMap[item.bento] || "/hambagu.png"} alt={item.bento} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-[0.85rem] text-[#2d3436] truncate">{item.bento}</span>
                                                        <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-bold">{item.status || '完了'}</span>
                                                    </div>
                                                    <span className="text-[0.65rem] text-gray-400">予約完了</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-auto pt-8">
                        <button onClick={() => { sessionStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center gap-3 text-[#636e72] text-[0.9rem] p-3.5 rounded-xl hover:bg-red-50 hover:text-[#d63031] font-bold">
                            <span>👤</span><span>ログアウト</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* 詳細モーダル */}
            {selectedHistory && (() => {
                const details = getBentoDetails(selectedHistory.bento);
                const buildingId = sessionStorage.getItem('building_id') || 'default';
                const style = buildingStyles[buildingId] || buildingStyles['default'];
                return (
                    <div className="fixed inset-0 z-[2500] flex items-end md:items-center justify-center p-0 md:p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedHistory(null)}></div>
                        <div className="relative bg-white w-full max-w-[500px] rounded-t-[32px] md:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom duration-300">
                            <div className={`${style.bg} p-6 text-white text-center`}>
                                <h3 className="text-xl font-black">{new Date(selectedHistory.date).toLocaleDateString('ja-JP')} の予約</h3>
                                <button onClick={() => setSelectedHistory(null)} className="absolute top-6 right-6">✕</button>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-5 mb-6">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100"><img src={bentoImageMap[selectedHistory.bento] || "/hambagu.png"} className="w-full h-full object-cover" /></div>
                                    <div className="flex flex-col justify-center">
                                        <h4 className="text-lg font-black text-gray-800">{selectedHistory.bento}</h4>
                                        <span className="text-sm font-bold text-[#d63031]">¥{details?.price.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-8 text-sm">
                                    <div className="flex justify-between border-b pb-2"><span className="text-gray-400">受取場所</span><span className={`font-bold ${style.text}`}>{style.label}</span></div>
                                </div>
                                <button onClick={() => setSelectedHistory(null)} className="w-full p-4 bg-gray-900 text-white rounded-2xl font-black">閉じる</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}