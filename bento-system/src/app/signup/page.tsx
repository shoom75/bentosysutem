"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupAction } from '@/actions';
import { supabase } from '@/lib/supabase';
import {
    User,
    Lock,
    Building2,
    GraduationCap,
    Users,
    Hash,
    ArrowRight,
    Loader2,
    AlertCircle,
    Mail,
    Eye,
    EyeOff,
    Key
} from 'lucide-react';

const toHalfWidth = (str: string) => {
    return str.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
};

const buildings = [
    { id: 1, name: '1号館' },
    { id: 2, name: '2号館' },
    { id: 3, name: '3号館' },
    { id: 4, name: '4号館' },
    { id: 5, name: '5号館' },
    { id: 6, name: '6号館' },
];

const grades = [1, 2, 3, 4];

export default function SignupPage() {
    const [formData, setFormData] = useState({
        num: '',
        password: '',
        password_confirm: '',
        email: '',
        building_id: '1',
        school_year: '1',
        class: 'A',
        attendance_num: '',
        secret_answer: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const router = useRouter();

    // 年度計算
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const fiscalYear = currentMonth < 4 ? currentYear - 1 : currentYear;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirm) {
            setError('パスワードが一致しません');
            return;
        }
        setIsConfirming(true);
    };

    const handleFinalSubmit = async () => {
        setIsConfirming(false);
        setError('');
        setLoading(true);

        const num = parseInt(toHalfWidth(formData.num), 10);
        const school_year = parseInt(formData.school_year, 10);
        const attendance_num = parseInt(toHalfWidth(formData.attendance_num), 10);
        const building_id = parseInt(formData.building_id, 10);

        if (isNaN(num)) {
            setError('学籍番号を正しく入力してください');
            setLoading(false);
            return;
        }

        if (isNaN(attendance_num)) {
            setError('番号を正しく入力してください');
            setLoading(false);
            return;
        }

        try {
            const result = await signupAction({
                num,
                password: formData.password,
                email: formData.email,
                building_id,
                school_year,
                class: formData.class.toUpperCase(),
                attendance_num,
                secret_answer: formData.secret_answer.trim()
            });

            if (result.success && result.user) {
                // クライアントのブラウザにもセッション（ログイン状態）を同期
                if (result.session) {
                    await supabase.auth.setSession({
                        access_token: result.session.access_token,
                        refresh_token: result.session.refresh_token,
                    });
                }

                sessionStorage.setItem('userId', result.user.id.toString());
                sessionStorage.setItem('studentNum', result.user.num.toString());
                sessionStorage.setItem('building_id', result.user.building_id.toString());
                sessionStorage.setItem('is_root', 'false');
                router.replace('/');
            } else {
                setError(result.error || '登録に失敗しました');
            }
        } catch (err) {
            setError('通信エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 ">
            <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                {/* ヘッダー */}
                <div className="bg-[#d63031] p-4 text-white relative overflow-hidden text-center md:text-left">
                    <div className="relative z-10">
                        <h1 className="text-2xl md:text-3xl flex justify-center font-black">アカウント作成</h1>

                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handlePreSubmit} className="space-y-5">
                        {/* メールアドレス */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <Mail className="w-3 h-3" /> メールアドレス
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="name@example.com"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* 学籍番号 */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <User className="w-3 h-3" /> 学籍番号
                            </label>
                            <input
                                type="text"
                                name="num"
                                required
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="2201..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all"
                                value={formData.num}
                                onChange={(e) => {
                                    const value = toHalfWidth(e.target.value).replace(/[^0-9]/g, '');
                                    setFormData(prev => ({ ...prev, num: value }));
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* パスワード */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                    <Lock className="w-3 h-3" /> パスワード
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        minLength={6}
                                        placeholder="6文字以上で入力"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onMouseDown={() => setShowPassword(true)}
                                        onMouseUp={() => setShowPassword(false)}
                                        onMouseLeave={() => setShowPassword(false)}
                                        onTouchStart={() => setShowPassword(true)}
                                        onTouchEnd={() => setShowPassword(false)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* パスワード確認 */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                    <Lock className="w-3 h-3" /> パスワード確認
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswordConfirm ? "text" : "password"}
                                        name="password_confirm"
                                        required
                                        minLength={6}
                                        placeholder="6文字以上で入力"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all"
                                        value={formData.password_confirm}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onMouseDown={() => setShowPasswordConfirm(true)}
                                        onMouseUp={() => setShowPasswordConfirm(false)}
                                        onMouseLeave={() => setShowPasswordConfirm(false)}
                                        onTouchStart={() => setShowPasswordConfirm(true)}
                                        onTouchEnd={() => setShowPasswordConfirm(false)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                                    >
                                        {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 秘密の合言葉 */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <Key className="w-3 h-3" /> 合言葉（パスワードを忘れた時用）
                            </label>
                            <input
                                type="text"
                                name="secret_answer"
                                required
                                placeholder="好きな食べ物や、ペットの名前など"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all"
                                value={formData.secret_answer}
                                onChange={handleChange}
                            />
                        </div>

                        {/* 所属号館 */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <Building2 className="w-3 h-3" /> 所属号館
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {buildings.map((b) => (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, building_id: b.id.toString() }))}
                                        className={`py-3 rounded-xl text-xs font-black transition-all border ${formData.building_id === b.id.toString()
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-[1.02]'
                                            : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                                            }`}
                                    >
                                        {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-5">
                            {/* 学年 */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                    <GraduationCap className="w-3 h-3" /> 学年
                                </label>
                                <select
                                    name="school_year"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all appearance-none cursor-pointer"
                                    value={formData.school_year}
                                    onChange={handleChange}
                                >
                                    {grades.map(g => (
                                        <option key={g} value={g}>{g}年</option>
                                    ))}
                                </select>
                            </div>

                            {/* クラス */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                    <Users className="w-3 h-3" /> クラス
                                </label>
                                <select
                                    name="class"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all appearance-none cursor-pointer"
                                    value={formData.class}
                                    onChange={handleChange}
                                >
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(c => (
                                        <option key={c} value={c}>{c}組</option>
                                    ))}
                                </select>
                            </div>

                            {/* 番号 */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                    <Hash className="w-3 h-3" /> 出席番号
                                </label>
                                <input
                                    type="text"
                                    name="attendance_num"
                                    required
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="1"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/10 focus:border-[#d63031] transition-all"
                                    value={formData.attendance_num}
                                    onChange={(e) => {
                                        const value = toHalfWidth(e.target.value).replace(/[^0-9]/g, '');
                                        setFormData(prev => ({ ...prev, attendance_num: value }));
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-[#d63031] hover:bg-[#b82728] disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>登録内容を確認する</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-slate-400 text-xs font-bold mt-6 tracking-tight">
                            既にアカウントをお持ちですか？{' '}
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="text-[#d63031] hover:underline"
                            >
                                ログインはこちら
                            </button>
                        </p>
                    </form>
                </div>
            </div>

            {/* 確認モーダル */}
            {isConfirming && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConfirming(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 pb-0">
                            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 text-[#d63031]" />
                                入力内容の確認
                            </h3>
                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold">年度</span>
                                    <span className="text-slate-700 font-black">{fiscalYear}年度</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                                    <span className="text-slate-400 font-bold">学籍番号</span>
                                    <span className="text-slate-700 font-black">{formData.num}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-200 pt-3 text-black">
                                    <span className="text-slate-400 font-bold">メール</span>
                                    <span className="text-slate-700 font-black truncate max-w-[200px]">{formData.email}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-200 pt-3 text-black">
                                    <span className="text-slate-400 font-bold">クラス</span>
                                    <span className="text-slate-700 font-black">{formData.school_year}年 {formData.class.toUpperCase()}組 {formData.attendance_num}番</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-200 pt-3 text-black">
                                    <span className="text-slate-400 font-bold">受取場所</span>
                                    <span className="text-slate-700 font-black">{buildings.find(b => b.id.toString() === formData.building_id)?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-200 pt-3 text-black">
                                    <span className="text-slate-400 font-bold">合言葉</span>
                                    <span className="text-slate-700 font-black truncate max-w-[200px]">{formData.secret_answer}</span>
                                </div>
                            </div>
                            <p className="mt-6 text-[11px] text-slate-400 font-bold leading-relaxed">
                                ※既存の学生データと照合し、アカウントを有効化します。内容に誤りがある場合は登録できません。
                            </p>
                        </div>
                        <div className="p-8 flex flex-col gap-3">
                            <button
                                onClick={handleFinalSubmit}
                                className="w-full bg-[#d63031] text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 hover:bg-[#b82728] transition-all active:scale-[0.98]"
                            >
                                この内容で登録する
                            </button>
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="w-full bg-white text-slate-500 font-black py-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all"
                            >
                                修正する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
