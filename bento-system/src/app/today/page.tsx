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

export default function TodayPage() {
    const [todayItems, setTodayItems] = useState<HistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getTodayDateStr = () => {
        return new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replaceAll('/', '-');
    };

    const fetchTodayHistory = useCallback(async () => {
        const userId = sessionStorage.getItem('userId');
        const userName = sessionStorage.getItem('userName');
        if (!userId) return;

        const todayStr = getTodayDateStr();

        if (todayItems.length === 0) setIsLoading(true);

        try {
            const data = await getHistoryAction(userId);
            if (data.success) {
                const filtered = data.history.filter((item: HistoryRecord) => item.date === todayStr);
                setTodayItems(filtered);
                localStorage.setItem(`history_${userName}`, JSON.stringify(data.history));
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoading(false);
        }
    }, [todayItems.length]);

    useEffect(() => {
        fetchTodayHistory();
        const handleUpdate = () => fetchTodayHistory();
        window.addEventListener('reservation-updated', handleUpdate);
        const interval = setInterval(fetchTodayHistory, 60000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('reservation-updated', handleUpdate);
        };
    }, [fetchTodayHistory]);

    const getBentoDetails = (name: string) => ALL_BENTO_ITEMS.find(item => item.name === name);

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-[100vh]">
            <h1 className="text-3xl font-black text-gray-800 mb-8 border-b-4 border-red-600 inline-block pb-2">当日の受け取り</h1>
            
            {isLoading && todayItems.length === 0 ? (
                <div className="text-center py-10 text-lg text-gray-500">読み込み中...</div>
            ) : todayItems.length === 0 ? (
                <div className="text-center py-10 text-lg text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">本日の予約はありません</div>
            ) : (
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-black text-white bg-[#d63031] px-5 py-2 rounded-full shadow-sm">
                                本日: {new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())}
                            </span>
                            <div className="h-[2px] flex-grow bg-gray-200"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {todayItems.map((item, idx) => {
                                const details = getBentoDetails(item.bento);
                                const buildingId = typeof window !== 'undefined' ? (sessionStorage.getItem('building_id') || 'default') : 'default';
                                const style = buildingStyles[buildingId] || buildingStyles['default'];
                                return (
                                    <div key={idx} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className={`${style.bg} p-5 md:p-6 text-white text-center`}>
                                            <h3 className="text-xl md:text-2xl font-black">{new Date(item.date).toLocaleDateString('ja-JP')} の受け取り</h3>
                                        </div>
                                        <div className="p-6 md:p-8 flex-grow flex flex-col">
                                            <div className="flex flex-col items-center gap-4 md:gap-6 mb-6 md:mb-8">
                                                <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden border border-gray-100 shadow-md shrink-0">
                                                    <img src={bentoImageMap[item.bento] || "/hambagu.png"} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col justify-center items-center text-center">
                                                    <h4 className="text-2xl md:text-3xl font-black text-gray-800 mb-1 md:mb-2 leading-tight">{item.bento}</h4>
                                                    <span className="text-xl md:text-2xl font-black text-[#d63031]">¥{details?.price.toLocaleString() || '---'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-4 mb-6 md:mb-8 text-sm md:text-base bg-gray-50 p-4 md:p-5 rounded-xl border border-gray-200">
                                                <div className="flex justify-between border-b border-gray-200 pb-3">
                                                    <span className="text-gray-500 font-bold">受取場所</span>
                                                    <span className={`font-black ${style.text} text-base md:text-lg`}>{style.label}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-200 pb-3">
                                                    <span className="text-gray-500 font-bold">ステータス</span>
                                                    <span className="font-black text-red-600">未受け取り</span>
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl font-bold text-center shadow-inner mt-auto text-sm md:text-base border border-yellow-200">
                                                受取場所に到着したら、この画面を係の者に見せてください
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
