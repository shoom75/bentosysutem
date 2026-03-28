"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Key, Lock, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { resetPasswordWithSecretAction } from '@/actions';

const toHalfWidth = (str: string) => {
    return str.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
};

export default function ForgotPasswordPage() {
    const [formData, setFormData] = useState({
        num: '',
        secret_answer: '',
        password: '',
        password_confirm: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (formData.password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            return;
        }

        if (formData.password !== formData.password_confirm) {
            setError('確認用パスワードが一致しません');
            return;
        }

        setLoading(true);

        const num = toHalfWidth(formData.num).replace(/[^0-9]/g, '');

        try {
            const result = await resetPasswordWithSecretAction(
                num,
                formData.secret_answer,
                formData.password
            );

            if (result.success) {
                setIsSuccess(true);
            } else {
                setError(result.error || 'パスワードの再設定に失敗しました');
            }
        } catch (err) {
            setError('通信エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-green-100">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-4">設定完了！</h2>
                    <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed">
                        パスワードの再設定が完了しました。<br />
                        新しいパスワードでログインしてください。
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-[#d63031] text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-[0.98]"
                    >
                        ログイン画面へ進む
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-10 px-4 items-center">
            
            <div className="w-full max-w-lg mb-4 flex items-center">
                <button 
                    onClick={() => router.back()}
                    className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-500 hover:text-slate-800"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                <div className="bg-[#d63031] p-6 text-white text-center sm:text-left">
                    <h1 className="text-2xl font-black flex items-center justify-center sm:justify-start gap-3">
                        <Lock className="w-6 h-6" />
                        合言葉でパスワードを再設定
                    </h1>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <User className="w-3 h-3" /> 学籍番号
                            </label>
                            <input
                                type="text"
                                name="num"
                                required
                                inputMode="numeric"
                                placeholder="2201..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/20 focus:border-[#d63031] transition-all"
                                value={formData.num}
                                onChange={(e) => {
                                    const value = toHalfWidth(e.target.value).replace(/[^0-9]/g, '');
                                    setFormData(prev => ({ ...prev, num: value }));
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <Key className="w-3 h-3" /> 登録した合言葉
                            </label>
                            <input
                                type="text"
                                name="secret_answer"
                                required
                                placeholder="登録時に設定した合言葉"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/20 focus:border-[#d63031] transition-all"
                                value={formData.secret_answer}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="border-t border-slate-100 my-6 pt-6"></div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <Lock className="w-3 h-3 text-[#d63031]" /> 新しいパスワード
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    minLength={6}
                                    placeholder="6文字以上で入力"
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/20 focus:border-[#d63031] transition-all"
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

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                                <Lock className="w-3 h-3 text-[#d63031]" /> 新しいパスワード（確認）
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswordConfirm ? "text" : "password"}
                                    name="password_confirm"
                                    required
                                    minLength={6}
                                    placeholder="もう一度入力"
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#d63031]/20 focus:border-[#d63031] transition-all"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-[#d63031] hover:bg-red-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'パスワードを再設定する'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
