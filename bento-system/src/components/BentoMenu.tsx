"use client";

import React from 'react';
import { BentoItem } from '@/types';

interface BentoMenuProps {
    items: BentoItem[];
    selectedId: number;
    onSelect: (id: number) => void;
}

export default function BentoMenu({ items, selectedId, onSelect }: BentoMenuProps) {
    return (
        <section id="menu" className="py-10">
            <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
                <div className="mb-6 text-left border-l-4 border-[#d63031] pl-4">
                    <h2 className="text-[1.4rem] font-bold text-[#2d3436]">お弁当を選択</h2>
                    <p className="text-sm text-gray-500">お好きなメニューを選んでください</p>
                </div>
                <div className="grid grid-cols-3 gap-3 md:gap-5">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`flex flex-col items-center p-4 border-2 rounded-xl text-center transition-all duration-200 cursor-pointer shadow-sm ${selectedId === item.id
                                    ? 'border-[#d63031] bg-[#d63031]'
                                    : 'border-white bg-white hover:border-gray-200'
                                }`}
                            onClick={() => onSelect(item.id)}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[1.1rem] mb-3 shrink-0 ${selectedId === item.id ? 'bg-white text-[#d63031]' : 'bg-[#d63031] text-white'
                                }`}>{item.label}</div>
                            <div className="w-full">
                                <h3 className={`text-[0.9rem] font-bold mb-1 overflow-hidden whitespace-nowrap text-ellipsis ${selectedId === item.id ? 'text-white' : 'text-[#2d3436]'
                                    }`}>{item.name}</h3>
                                <span className={`text-[0.9rem] font-semibold block ${selectedId === item.id ? 'text-white' : 'text-[#d63031]'
                                    }`}>¥{item.price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
