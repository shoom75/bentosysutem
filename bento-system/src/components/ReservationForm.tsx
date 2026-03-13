"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { BentoItem } from '@/types';
import { getHistoryAction, reserveAction } from '@/actions';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface ReservationFormProps {
    date: any;
    setDate: (date: any) => void;
    onDateClick?: (date: Date) => void;
}

export default function ReservationForm({ date, setDate, onDateClick }: ReservationFormProps) {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [studentName, setStudentName] = useState("");
    const [reservedDates, setReservedDates] = useState<string[]>([]);

    useEffect(() => {
        const savedName = sessionStorage.getItem('userName');
        if (savedName) {
            setStudentName(savedName);
            fetchReservedDates(savedName);
        }
    }, []);

    const fetchReservedDates = async (name: string) => {
        const cached = localStorage.getItem(`reserved_dates_${name}`);
        if (cached) {
            try { setReservedDates(JSON.parse(cached)); } catch (e) { }
        }

        try {
            const data = await getHistoryAction(name);
            if (data.success && data.history) {
                const dates = data.history.map((h: any) => {
                    try {
                        const d = new Date(h.date);
                        if (isNaN(d.getTime())) return h.date;
                        return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(d);
                    } catch (e) { return h.date; }
                });
                setReservedDates(dates);
                localStorage.setItem(`reserved_dates_${name}`, JSON.stringify(dates));
            }
        } catch (error) {
            console.error("履歴取得エラー:", error);
        }
    };

    const handleDateChange = (value: any) => {
        setDate(value);
        if (value instanceof Date && onDateClick) {
            onDateClick(value);
        }
    };

    const getTileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view !== 'month') return null;
        const dateStr = new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
        const isReserved = reservedDates.some(rd => rd === dateStr);

        return isReserved ? (
            <div className="flex justify-center mt-0.5">
                <div className="w-1.5 h-1.5 bg-[#0984e3] rounded-full shadow-sm"></div>
            </div>
        ) : null;
    };

    return (
        <section id="reservation" className="py-10">
            <div className="max-w-[1200px] mx-auto px-5 lg:px-8 flex justify-center">
                <div className="bg-white p-4 md:p-10 rounded-2xl shadow-xl w-full max-w-[500px]">
                    <div className="text-center mb-6">
                        <h2 className="text-[1.6rem] font-black mb-2 text-[#2d3436]">予約日を選択</h2>
                        <p className="text-gray-500 text-sm">カレンダーから日付をタップしてください</p>
                        <div className="inline-block mt-4 px-4 py-1.5 bg-red-50 rounded-full text-sm font-bold text-[#d63031] border border-red-100">
                            予約者：{studentName} さん
                        </div>
                    </div>

                    <div className="w-full flex justify-center mb-6 custom-calendar hide-weekends">
                        <Calendar
                            onChange={handleDateChange}
                            value={date}
                            locale="ja-JP"
                            calendarType="gregory"
                            minDetail="month"
                            maxDetail="month"
                            minDate={tomorrow}
                            formatDay={(locale, date) => date.getDate().toString()}
                            tileContent={getTileContent}
                            tileDisabled={({ date }) => date.getDay() === 0 || date.getDay() === 6}
                        />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 text-center leading-relaxed">
                            ※ 当日の予約は承っておりません。明日以降の平日を選択してください。<br />
                            日付を選択するとお弁当メニューが表示されます。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
