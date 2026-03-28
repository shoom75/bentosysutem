"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getTeacherOrdersAction } from '@/actions';
import { useRouter } from 'next/navigation';
import { 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    Building2, 
    User, 
    UtensilsCrossed,
    RefreshCw,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';

interface Order {
    order_id: number;
    student_num: number;
    building_id: number;
    bento_type: string;
    order_date: string;
    is_received: boolean;
    received_at: string | null;
}

const buildingLabel: Record<number, string> = {
    1: '1号館',
    2: '2号館',
    3: '3号館',
    4: '4号館',
    5: '5号館',
    6: '6号館',
};

export default function TeacherPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [displayDate, setDisplayDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'received' | 'not_received'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRoot, setIsRoot] = useState(false);
    const [userBuildingId, setUserBuildingId] = useState<string | null>(null);
    const router = useRouter();

    const todayStr = () => {
        const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const fetchOrders = useCallback(async (date?: string) => {
        setIsLoading(true);
        try {
            const result = await getTeacherOrdersAction(date);
            if (result.success) {
                setOrders(result.orders as Order[]);
                setDisplayDate(result.date);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const root = sessionStorage.getItem('is_root') === 'true';
        const bid = sessionStorage.getItem('building_id');
        const isStaff = root; // 管理者(is_root)のみに制限

        if (!isStaff) {
            router.replace('/');
            return;
        }

        setIsRoot(root);
        setUserBuildingId(bid);
        fetchOrders(todayStr());
    }, [router, fetchOrders]);

    const filteredOrders = orders.filter(o => {
        // ステータスフィルター
        if (filter === 'received' && !o.is_received) return false;
        if (filter === 'not_received' && o.is_received) return false;

        // 検索クエリ（学籍番号または弁当名）
        if (searchQuery && !o.student_num.toString().includes(searchQuery) && !o.bento_type.includes(searchQuery)) {
            return false;
        }

        // 建物フィルター：Root権限がない場合は自分の所属館のみ
        if (!isRoot && userBuildingId && o.building_id.toString() !== userBuildingId) {
            return false;
        }

        return true;
    });

    const receivedCount = orders.filter(o => o.is_received).length;
    const notReceivedCount = orders.filter(o => !o.is_received).length;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-20">
                
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="md:hidden p-2 -ml-2 text-slate-400">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-800">当日状況</h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{displayDate || 'TODAY'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => fetchOrders(todayStr())}
                        disabled={isLoading}
                        className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 active:rotate-180 transition-transform duration-500"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
                        </div>
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[24px] animate-pulse" />)}
                    </div>
                ) : (
                    <>
                        {/* サマリーカード */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 text-center">
                                <div className="text-xl font-black text-slate-800">{orders.length}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase">総数</div>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-[24px] border border-emerald-100 text-center">
                                <div className="text-xl font-black text-emerald-600">{receivedCount}</div>
                                <div className="text-[10px] font-black text-emerald-500 uppercase">受取済</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-[24px] border border-orange-100 text-center">
                                <div className="text-xl font-black text-orange-600">{notReceivedCount}</div>
                                <div className="text-[10px] font-black text-orange-500 uppercase">未受取</div>
                            </div>
                        </div>

                        {/* 検索・フィルター */}
                        <div className="sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-md py-4 space-y-4 mb-2">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#d63031] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="学籍番号や弁当名で検索..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {(['all', 'not_received', 'received'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`shrink-0 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${filter === f
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                            : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
                                            }`}
                                    >
                                        {f === 'all' ? 'すべて' : f === 'received' ? '受取済のみ' : '未受取のみ'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 注文リスト */}
                        <div className="space-y-3 mt-4">
                            {filteredOrders.length === 0 ? (
                                <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Filter className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="font-black text-slate-400">該当するデータがありません</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div
                                        key={order.order_id}
                                        className={`bg-white rounded-[24px] p-4 border transition-all duration-300 ${order.is_received ? 'border-slate-100 opacity-60' : 'border-slate-100 shadow-sm hover:border-[#d63031]/30'}`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${order.is_received ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                                                    {order.is_received ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-base font-black text-slate-800 tracking-tight">{order.student_num}</span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                                                            {buildingLabel[order.building_id] || `${order.building_id}号館`}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                                                        <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {order.bento_type}</span>
                                                        {order.received_at && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> 
                                                                {new Date(order.received_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <ChevronRight className={`w-5 h-5 ${order.is_received ? 'text-slate-200' : 'text-slate-300'}`} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}



