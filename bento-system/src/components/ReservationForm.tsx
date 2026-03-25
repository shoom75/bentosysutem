"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// 1. react-calendarが提供する可能性のある値を網羅した型
type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

interface ReservationFormProps {
    date: Date;
    setDate: (date: Date) => void;
    onDateClick?: (date: Date) => void;
    reservedDates: string[];
    scheduleDates?: string[]; // 弁当がある日付
}

export default function ReservationForm({ date, setDate, onDateClick, reservedDates, scheduleDates = [] }: ReservationFormProps) {
    const today = new Date();
    // 予約可能開始日（明日）
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [studentName, setStudentName] = useState("");

    const formatDateKey = (d: Date) => {
        return d.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replaceAll('/', '-');
    };

    useEffect(() => {
        const userName = sessionStorage.getItem('userName');
        if (userName) setStudentName(userName);
    }, []);

    const handleDateChange = (value: CalendarValue) => {
        if (value instanceof Date) {
            setDate(value);
            onDateClick?.(value);
        }
    };

    const getTileContent = ({ date: tileDate, view }: { date: Date; view: string }) => {
        if (view !== 'month') return null;
        const tileDateStr = formatDateKey(tileDate);
        const isReserved = reservedDates.includes(tileDateStr);

        return isReserved ? (
            <div className="flex justify-center mt-0.5">
                <div className="w-1.5 h-1.5 bg-[#0984e3] rounded-full shadow-sm animate-in zoom-in duration-300"></div>
            </div>
        ) : null;
    };

    const getTileClassName = ({ date: tileDate, view }: { date: Date; view: string }) => {
        if (view !== 'month') return '';
        const tileDateStr = formatDateKey(tileDate);
        const hasSchedule = scheduleDates.includes(tileDateStr);

        // 当日以前ならグレーアウト
        const isPastOrToday = tileDate.getTime() <= today.setHours(23, 59, 59, 999);

        let classes = hasSchedule ? 'has-bento-schedule' : '';
        if (isPastOrToday) classes += ' is-past-or-today';

        return classes;
    };

    // 今日以前、および土日を無効化
    const isTileDisabled = ({ date: d }: { date: Date }) => {
        const day = d.getDay();
        // 土(6) 日(0) は常に不可
        if (day === 0 || day === 6) return true;

        // 今日以前（当日含む）は不可
        const todayCopy = new Date();
        todayCopy.setHours(0, 0, 0, 0);
        return d.getTime() < todayCopy.getTime() + 86400000; // 明日より前は無効
    };

    return (
        <section id="reservation" className="py-10">
            <div className="max-w-[1200px] mx-auto px-5 lg:px-8 flex justify-center">
                <div className="bg-white p-4 md:p-10 rounded-2xl shadow-xl w-full max-w-[500px]">
                    <div className="text-center mb-6">
                        <h2 className="text-[1.6rem] font-black mb-2 text-[#2d3436]">予約日を選択</h2>
                        <p className="text-gray-500 text-sm">カレンダーから日付をタップしてください</p>
                        {studentName && (
                            <div className="inline-block mt-4 px-4 py-1.5 bg-red-50 rounded-full text-sm font-bold text-[#d63031] border border-red-100">
                                予約者：{studentName} さん
                            </div>
                        )}
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
                            formatDay={(_, d) => d.getDate().toString()}
                            tileContent={getTileContent}
                            tileClassName={getTileClassName}
                            tileDisabled={isTileDisabled}
                        />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex flex-wrap justify-center gap-4 mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-md bg-[#fff3e0] border border-[#ffccaa]"></div>
                                <span>弁当入力情報あり</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#0984e3]"></div>
                                <span>予約済み</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center leading-relaxed">
                            ※ 当日の予約は承っておりません。明日以降の平日を選択してください。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}