"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CompletePage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const userName = sessionStorage.getItem('userName');
        if (!userName) {
            router.replace('/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-5 bg-[#fdfdfd] bg-gradient-to-br from-[#d63031]/5 to-[#f8f9fa]/10">
            <div className="bg-white w-full max-w-[440px] p-8 md:p-10 rounded-2xl shadow-2xl relative overflow-hidden border-t-4 border-[#2ecc71] text-center">
                <div className="w-16 h-16 bg-[#2ecc71] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-[2rem] shadow-sm animate-bounce-short">
                    ✓
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-[#2d3436] mb-4">予約が完了しました</h1>

                <p className="text-[#636e72] mb-8 leading-relaxed text-[0.95rem]">
                    お弁当のご予約を承りました。<br />
                </p>

                <div className="bg-[#f8f9fa] p-5 rounded-xl mb-8 text-left text-[0.9rem] border border-[#eaeced]">
                    <div className="mb-2 flex justify-between items-center">
                        <span className="text-[#636e72]">予約番号</span>
                        <span className="font-extrabold text-[#2d3436]">#BK-20260305</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[#636e72]">受取場所</span>
                        <span className="font-extrabold text-[#2d3436]">1F 受付カウンター</span>
                    </div>
                </div>

                <Link href="/" className="btn btn-primary w-full p-4 mb-4 shadow-md no-underline">
                    予約画面戻る
                </Link>


            </div>
        </div>

    );
}
