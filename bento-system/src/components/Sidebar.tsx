"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getHistoryAction } from '@/actions';

interface HistoryRecord {
    id: string | number;
    bento: string;
    date: string;
    status: string;
}

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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

                <div className="flex-grow overflow-y-auto p-5 pb-8 flex flex-col">
                    <span className="text-[0.85rem] font-extrabold text-[#636e72] uppercase tracking-[1px] mb-4 block">予約履歴</span>

                    {isLoading && history.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-400">読み込み中...</div>
                    ) : history.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {history.map((item, idx) => (
                                <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#eaeced] transition-all duration-200 hover:border-[#d63031] hover:shadow-md cursor-default group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.7rem] font-bold text-[#d63031] mb-0.5">
                                                {(() => {
                                                    try {
                                                        const d = new Date(item.date);
                                                        if (isNaN(d.getTime())) return item.date;
                                                        return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(d);
                                                    } catch (e) { return item.date; }
                                                })()} 予約
                                            </span>
                                            <span className="font-bold text-[0.95rem] text-[#2d3436]">{item.bento}</span>
                                        </div>
                                        <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold border border-green-100">
                                            {item.status || '完了'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">履歴はありません</div>
                    )}

                    <div className="mt-auto pt-10">
                        <button
                            onClick={() => {
                                const userName = sessionStorage.getItem('userName');
                                sessionStorage.clear();
                                if (userName) localStorage.removeItem(`history_${userName}`);
                                window.location.href = '/login';
                            }}
                            className="w-full flex items-center gap-2.5 text-[#636e72] text-[0.9rem] p-3 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 border-none bg-transparent cursor-pointer font-medium"
                        >
                            <span>👤</span>
                            <span>ログアウト</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
