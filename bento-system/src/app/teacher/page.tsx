"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getTeacherOrdersAction } from '@/actions';
import { useRouter } from 'next/navigation';

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
    const [targetDate, setTargetDate] = useState('');
    const [displayDate, setDisplayDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'received' | 'not_received'>('all');
    const router = useRouter();

    const todayStr = () => new Date().toLocaleDateString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).replaceAll('/', '-');

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
        // 教員・職員チェック
        const isRoot = sessionStorage.getItem('is_root');
        const studentNum = sessionStorage.getItem('studentNum');
        
        // Root または 4桁以下の番号は教職員として扱う
        const isStaff = isRoot === 'true' || (studentNum && studentNum.length <= 4);

        if (!isStaff) {
            router.replace('/');
            return;
        }
        const today = todayStr();
        setTargetDate(today);
        fetchOrders(today);
    }, [router, fetchOrders]);

    const handleDateSearch = () => {
        if (targetDate) fetchOrders(targetDate);
    };

    const filteredOrders = orders.filter(o => {
        // ステータスフィルター
        if (filter === 'received' && !o.is_received) return false;
        if (filter === 'not_received' && o.is_received) return false;

        // 建物フィルター：Root権限がない場合は自分の所属館のみ
        const isRoot = sessionStorage.getItem('is_root') === 'true';
        const userBuildingId = sessionStorage.getItem('building_id');
        if (!isRoot && userBuildingId && o.building_id.toString() !== userBuildingId) {
            return false;
        }

        return true;
    });

    const receivedCount = orders.filter(o => o.is_received).length;
    const notReceivedCount = orders.filter(o => !o.is_received).length;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
            {/* ヘッダー */}
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-[#d63031] rounded-2xl flex items-center justify-center text-white text-2xl shadow-md">
                    👨‍🏫
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-800">教員管理画面</h1>
                    <p className="text-gray-500 text-sm">弁当注文・受け取り状況の管理</p>
                </div>
            </div>

            {/* 日付選択 */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 flex flex-col sm:flex-row gap-3 items-center mt-6 mb-6">
                <label className="font-bold text-gray-700 shrink-0">📅 日付を指定：</label>
                <input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="flex-grow border border-gray-200 rounded-xl px-4 py-2 text-gray-700 focus:ring-2 focus:ring-red-400 outline-none"
                />
                <button
                    onClick={handleDateSearch}
                    className="px-6 py-2 bg-[#d63031] hover:bg-[#b82728] text-white font-black rounded-xl transition-all shadow"
                >
                    検索
                </button>
                <button
                    onClick={() => { const t = todayStr(); setTargetDate(t); fetchOrders(t); }}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                >
                    今日
                </button>
            </div>

            {/* サマリーカード */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow p-4 text-center">
                    <div className="text-3xl font-black text-gray-800">{orders.length}</div>
                    <div className="text-sm text-gray-500 font-bold mt-1">総注文数</div>
                </div>
                <div className="bg-green-50 rounded-2xl border border-green-200 shadow p-4 text-center">
                    <div className="text-3xl font-black text-green-700">{receivedCount}</div>
                    <div className="text-sm text-green-600 font-bold mt-1">受け取り済み</div>
                </div>
                <div className="bg-orange-50 rounded-2xl border border-orange-200 shadow p-4 text-center">
                    <div className="text-3xl font-black text-orange-600">{notReceivedCount}</div>
                    <div className="text-sm text-orange-500 font-bold mt-1">未受け取り</div>
                </div>
            </div>

            {/* フィルター */}
            <div className="flex gap-2 mb-4">
                {(['all', 'not_received', 'received'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === f
                            ? 'bg-[#d63031] text-white shadow'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {f === 'all' ? 'すべて' : f === 'received' ? '✅ 受け取り済み' : '⏳ 未受け取り'}
                    </button>
                ))}
            </div>

            {/* 表示日付ラベル */}
            {displayDate && (
                <p className="text-gray-400 text-sm mb-3">{displayDate} の注文一覧（{filteredOrders.length}件）</p>
            )}

            {/* 注文リスト */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-400 animate-pulse text-lg">読み込み中...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-200 text-gray-500">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="font-bold">注文データがありません</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredOrders.map(order => (
                        <div
                            key={order.order_id}
                            className={`bg-white rounded-2xl border shadow-sm p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${order.is_received ? 'border-green-200 opacity-70' : 'border-gray-100'
                                }`}
                        >
                            {/* 受け取り状態バッジ */}
                            <div className="shrink-0">
                                {order.is_received ? (
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 font-black text-sm px-3 py-1 rounded-full">
                                        ✅ 受取済
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 font-black text-sm px-3 py-1 rounded-full">
                                        ⏳ 未受取
                                    </span>
                                )}
                            </div>

                            <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-400 text-xs font-bold block">学籍番号</span>
                                    <span className="font-black text-gray-800">{order.student_num}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs font-bold block">所属館</span>
                                    <span className="font-bold text-gray-700">{buildingLabel[order.building_id] || `${order.building_id}号館`}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs font-bold block">弁当名</span>
                                    <span className="font-bold text-gray-800">{order.bento_type}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs font-bold block">受取日時</span>
                                    <span className="font-bold text-gray-600 text-xs">
                                        {order.received_at
                                            ? new Date(order.received_at).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                                            : '---'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

