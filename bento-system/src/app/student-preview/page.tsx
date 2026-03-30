"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Info } from 'lucide-react';

export default function StudentPreviewPage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const isRoot = sessionStorage.getItem('is_root') === 'true';
        if (!isRoot) {
            router.replace('/');
            return;
        }
        setIsAuthorized(true);
    }, [router]);

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* ヘッダー */}
            <div className="bg-white border-b border-slate-100 p-4 px-8 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-red-50 p-2 rounded-xl">
                        <Eye className="w-5 h-5 text-[#d63031]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800">学生用ページ プレビュー</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">現在、学生に表示されている予約画面を確認できます</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500 text-xs font-bold leading-relaxed">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>プレビュー用の表示です。実際の予約操作は行えません。</span>
                </div>
            </div>

            {/* コンテンツ本体 */}
            <div className="flex-grow relative overflow-hidden">
                <iframe 
                    src="/?preview=true" 
                    className="w-full h-full border-none"
                    style={{ height: 'calc(100vh - 73px)' }}
                />
                
                {/* クリック防止用オーバーレイ（必要があれば） */}
                {/* <div className="absolute inset-0 z-10 bg-transparent" /> */}
            </div>
        </div>
    );
}
