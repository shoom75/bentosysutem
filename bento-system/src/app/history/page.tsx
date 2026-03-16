"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getHistoryAction, type HistoryRecord } from '@/actions';
import { ALL_BENTO_ITEMS } from '@/constants/bento';

const bentoImageMap: { [key: string]: string } = {
    "弁当A": "/hambagu.png", "弁当B": "/salmon.png", "弁当C": "/sushi.png",
    "弁当D": "/hambagu.png", "弁当E": "/salmon.png", "弁当F": "/sushi.png",
    "弁当G": "/hambagu.png",
};

const buildingStyles: { [key: string]: { bg: string, text: string, label: string } } = {
    '1': { bg: 'bg-blue-600', text: 'text-blue-600', label: '1号館受取' },
    '2': { bg: 'bg-red-600', text: 'text-red-600', label: '2号館受取' },
    '3': { bg: 'bg-green-600', text: 'text-green-600', label: '3号館受取' },
    'default': { bg: 'bg-[#2d3436]', text: 'text-gray-700', label: '1F 受付カウンター' }
};

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    const fetchHistory = useCallback(async () => {
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
                setHistory(data.history);
                localStorage.setItem(`history_${userName}`, JSON.stringify(data.history));
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoading(false);
        }
    }, [history.length]);

    useEffect(() => {
        fetchHistory();
        const handleUpdate = () => fetchHistory();
        window.addEventListener('reservation-updated', handleUpdate);
        const interval = setInterval(fetchHistory, 60000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('reservation-updated', handleUpdate);
        };
    }, [fetchHistory]);

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

    const totalPages = Math.ceil(sortedDates.length / ITEMS_PER_PAGE);
    const paginatedDates = sortedDates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-[100vh]">
            <h1 className="text-3xl font-black text-gray-800 mb-8 border-b-4 border-red-600 inline-block pb-2">予約履歴</h1>
            
            {isLoading && history.length === 0 ? (
                <div className="text-center py-10 text-lg text-gray-500">読み込み中...</div>
            ) : history.length === 0 ? (
                <div className="text-center py-10 text-lg text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">予約履歴はありません</div>
            ) : (
                <div className="flex flex-col gap-10">
                    {paginatedDates.map((dateStr) => (
                        <div key={dateStr} className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-black text-gray-800 bg-gray-100 px-4 py-1.5 rounded-full shadow-sm">
                                    {new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(dateStr))}
                                </span>
                                <div className="h-[2px] flex-grow bg-gray-200"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedHistory[dateStr].map((item, idx) => (
                                    <div key={idx} onClick={() => setSelectedHistory(item)} className="flex gap-4 p-5 rounded-3xl bg-white border border-[#eaeced] hover:border-[#d63031] cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                            <img src={bentoImageMap[item.bento] || "/hambagu.png"} alt={item.bento} className="w-full h-full object-cover relative z-0" />
                                        </div>
                                        <div className="flex-grow min-w-0 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-lg text-[#2d3436] line-clamp-2">{item.bento}</span>
                                                <span className="text-[0.65rem] px-2.5 py-1 rounded-full bg-green-50 text-green-600 font-black whitespace-nowrap">{item.status || '完了'}</span>
                                            </div>
                                            <span className="text-sm text-gray-400 font-medium">予約が完了しています</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* ページネーション */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}
                            >
                                ◀
                            </button>
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === i + 1 ? 'bg-[#d63031] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'}`}
                            >
                                ▶
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 詳細モーダル */}
            {selectedHistory && (() => {
                const details = getBentoDetails(selectedHistory.bento);
                const buildingId = typeof window !== 'undefined' ? (sessionStorage.getItem('building_id') || 'default') : 'default';
                const style = buildingStyles[buildingId] || buildingStyles['default'];
                return (
                    <div className="fixed inset-0 z-[2500] flex items-end md:items-center justify-center p-0 md:p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedHistory(null)}></div>
                        <div className="relative bg-white w-full max-w-[500px] rounded-t-[32px] md:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom duration-300">
                            <div className={`${style.bg} p-6 text-white text-center relative`}>
                                <h3 className="text-xl font-black">{new Date(selectedHistory.date).toLocaleDateString('ja-JP')} の予約</h3>
                                <button onClick={() => setSelectedHistory(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">✕</button>
                            </div>
                            <div className="p-8">
                                <div className="flex gap-6 mb-8">
                                    <div className="w-28 h-28 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                        <img src={bentoImageMap[selectedHistory.bento] || "/hambagu.png"} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h4 className="text-xl font-black text-gray-800 mb-1">{selectedHistory.bento}</h4>
                                        <span className="text-lg font-black text-[#d63031]">¥{details?.price.toLocaleString() || '---'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-8 text-base">
                                    <div className="flex justify-between border-b border-gray-100 pb-3">
                                        <span className="text-gray-500 font-bold">受取場所</span>
                                        <span className={`font-black ${style.text}`}>{style.label}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-3">
                                        <span className="text-gray-500 font-bold">ステータス</span>
                                        <span className="font-black text-green-600">予約完了</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedHistory(null)} className="w-full p-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 transition-colors shadow-lg active:scale-95">閉じる</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
