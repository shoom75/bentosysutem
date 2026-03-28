"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardList,
    BarChart3,
    Home,
    ShoppingBag,
    History,
    LogOut,
    Menu,
    X,
    User,
    ChevronRight
} from 'lucide-react';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isRoot, setIsRoot] = useState(false);
    const [studentNum, setStudentNum] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const root = sessionStorage.getItem('is_root');
        setIsRoot(root === 'true');
        setStudentNum(sessionStorage.getItem('studentNum'));
    }, []);

    const toggleSidebar = () => setIsOpen(!isOpen);

    if (pathname?.toLowerCase() === '/login' || pathname?.toLowerCase() === '/signup') return null;

    const NavLink = ({ href, icon: Icon, children }: { href: string, icon: any, children: React.ReactNode }) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                className={`flex items-center justify-between p-3.5 rounded-2xl font-bold transition-all duration-300 ${isActive ? 'bg-[#d63031] text-white shadow-lg shadow-red-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                onClick={() => setIsOpen(false)}
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-[14px]">{children}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
            </Link>
        );
    };

    return (
        <>
            {/* モバイル用ヘッダー */}
            <div className="lg:hidden flex justify-between items-center p-4 px-6 bg-white border-b border-slate-100 sticky top-0 z-[900]">
                <div className="flex items-center gap-3">
                    <button className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform" onClick={toggleSidebar}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-black text-slate-800 tracking-tight">国際理工弁当予約</span>
                </div>
            </div>

            {/* モバイル用オーバーレイ */}
            {isOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[950] lg:hidden animate-in fade-in duration-300" onClick={toggleSidebar}></div>}

            {/* サイドバー本体 */}
            <aside className={`fixed lg:sticky top-0 left-0 w-[280px] bg-white border-r border-slate-100 h-screen flex flex-col z-[1000] transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>

                {/* サイドバーヘッダー */}
                <div className="p-6 pb-8">
                    <div className="flex items-center justify-between mb-2">
                        <Link href={isRoot ? '/teacher' : '/'} className="no-underline" onClick={() => setIsOpen(false)}>
                            <h2 className="text-[1.2rem] font-black text-slate-900 m-0 tracking-tighter">国際理工<span className="text-[#d63031]">弁当予約</span></h2>
                        </Link>
                        <button className="lg:hidden p-2 text-slate-400" onClick={toggleSidebar}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {isRoot && (
                        <div className="inline-flex items-center gap-1.5 bg-red-50 text-[#d63031] px-2.5 py-1 rounded-lg border border-red-100">
                            <User className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Teacher Mode</span>
                        </div>
                    )}
                </div>

                {/* メインメニュー */}
                <div className="flex-grow overflow-y-auto px-4 space-y-8 no-scrollbar">

                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block pl-3">Main Menu</span>
                        <div className="flex flex-col gap-1.5">
                            {isRoot ? (
                                <>
                                    <NavLink href="/teacher" icon={ClipboardList}>当日状況ページ</NavLink>
                                    <NavLink href="/teacher/summary" icon={BarChart3}>予約集計ページ</NavLink>
                                </>
                            ) : (
                                <>
                                    <NavLink href="/" icon={Home}>ホーム（予約）</NavLink>
                                    <NavLink href="/today" icon={ShoppingBag}>本日の受け取り</NavLink>
                                    <NavLink href="/history" icon={History}>予約履歴</NavLink>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                {/* 下部メニュー */}
                <div className="p-4 pt-4 border-t border-slate-50 mt-auto space-y-2">
                    {studentNum && (
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-[#d63031] group-hover:text-white transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] text-slate-400 font-bold mb-0.5 uppercase tracking-wider">Logged In</span>
                                    <span className="text-sm font-black text-slate-800">{studentNum}</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </Link>
                    )}
                    <button
                        onClick={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl text-slate-500 font-bold hover:bg-red-50 hover:text-[#d63031] transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-[#d63031]" />
                            <span className="text-[14px]">ログアウト</span>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
}