import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/login'; // 確認後はログイン画面へ

    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });
        
        if (!error) {
            // 確認が成功した場合は指定のリダイレクト先へ
            const redirectUrl = new URL(next, request.url);
            // ログイン画面に成功メッセージを渡すためにクエリパラメータを付与
            redirectUrl.searchParams.set('verified', 'true');
            return NextResponse.redirect(redirectUrl);
        }
    }

    // エラー時はエラーページ（またはログイン画面にエラーパラメータ付きで）飛ばす
    const errorUrl = new URL('/login?error=verification_failed', request.url);
    return NextResponse.redirect(errorUrl);
}
