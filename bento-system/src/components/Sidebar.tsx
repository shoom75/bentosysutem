"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isRoot, setIsRoot] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const root = sessionStorage.getItem('is_root');
        setIsRoot(root === 'true');
    }, []);

    const toggleSidebar = () => setIsOpen(!isOpen);

    if (pathname?.toLowerCase() === '/login') return null;

    return (
        <>
            {/* モバイル用ヘッダー */}
            <div className="lg:hidden flex justify-between items-center p-3 px-5 bg-white border-b border-[#eaeced] sticky top-0 z-[900]">
                <div className="flex items-center">
                    <button className="text-2xl cursor-pointer mr-4 text-[#2d3436]" onClick={toggleSidebar}>☰</button>
                    <span className="font-extrabold text-[#2d3436]">国際理工弁当予約</span>
                </div>
            </div>

            {/* モバイル用オーバーレイ */}
            {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[950] lg:hidden" onClick={toggleSidebar}></div>}

            {/* サイドバー本体 */}
            <aside className={`fixed lg:sticky top-0 left-0 w-[280px] bg-white border-r border-[#eaeced] h-screen flex flex-col z-[1000] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-[#eaeced]">
                    <Link href={isRoot ? '/teacher' : '/'} className="no-underline" onClick={() => setIsOpen(false)}>
                        <h2 className="text-[1.4rem] font-bold text-[#d63031] m-0">国際理工弁当予約</h2>
                    </Link>
                    {isRoot && (
                        <span className="inline-block mt-1 text-xs font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            👨‍🏫 教員アカウント
                        </span>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto p-4 pb-8 flex flex-col">
                    {isRoot ? (
                        // 教員メニュー
                        <>
                            <span className="text-[0.75rem] font-black text-[#636e72] uppercase tracking-[1.5px] mb-4 block pl-1">教員メニュー</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/teacher"
                                    className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all ${pathname === '/teacher' ? 'bg-red-50 text-[#d63031] shadow-sm' : 'text-[#636e72] hover:bg-gray-50 hover:text-[#2d3436]'}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="text-xl">📋</span>
                                    <span>注文管理</span>
                                </Link>
                            </div>
                        </>
                    ) : (
                        // 生徒メニュー
                        <>
                            <span className="text-[0.75rem] font-black text-[#636e72] uppercase tracking-[1.5px] mb-4 block pl-1">メニュー</span>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/"
                                    className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all ${pathname === '/' ? 'bg-red-50 text-[#d63031] shadow-sm' : 'text-[#636e72] hover:bg-gray-50 hover:text-[#2d3436]'}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="text-xl">🍱</span>
                                    <span>ホーム（予約）</span>
                                </Link>

                                <Link
                                    href="/today"
                                    className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all ${pathname === '/today' ? 'bg-red-50 text-[#d63031] shadow-sm' : 'text-[#636e72] hover:bg-gray-50 hover:text-[#2d3436]'}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="text-xl">🛍️</span>
                                    <span>受け取り画面</span>
                                </Link>

                                <Link
                                    href="/history"
                                    className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all ${pathname === '/history' ? 'bg-red-50 text-[#d63031] shadow-sm' : 'text-[#636e72] hover:bg-gray-50 hover:text-[#2d3446]'}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="text-xl">📅</span>
                                    <span>予約履歴</span>
                                </Link>
                            </div>
                        </>
                    )}

                    {/* 下部メニュー */}
                    <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col gap-2">
                        <button
                            onClick={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                            className="w-full flex items-center gap-3 text-[#636e72] text-[0.9rem] p-3.5 rounded-xl hover:bg-red-50 hover:text-[#d63031] font-bold transition-colors"
                        >
                            <span className="text-lg">👤</span><span>ログアウト</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}