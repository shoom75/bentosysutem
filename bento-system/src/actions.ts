'use server'

import { supabase as supabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// サイドバー等で使用する共通型
export interface HistoryRecord {
    id: number;
    bento: string;
    date: string;
    status: string;
}

/**
 * ログイン: user_listテーブル (id, num, password, building_id)
 */
export async function loginAction(num: string, password?: string) {
    try {
        const studentNum = parseInt(num, 10);
        if (isNaN(studentNum)) return { success: false, error: '学籍番号を数値で入力してください' };

        const { data, error } = await supabaseClient
            .from('user_list')
            .select('id, num, password, building_id')
            .eq('num', studentNum)
            .eq('password', password)
            .single();

        if (error || !data) return { success: false, error: '学籍番号またはパスワードが違います' };

        return { 
            success: true, 
            user: { 
                id: data.id, 
                num: data.num,
                building_id: data.building_id
                // nameがないので、必要なら 'User ' + data.num などを返してもOK
            } 
        };
    } catch (e) {
        return { success: false, error: '通信エラーが発生しました' };
    }
}

/**
 * 履歴取得: order_logテーブル
 */
export async function getHistoryAction(userId: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, history: [] };

        const { data, error } = await supabaseClient
            .from('order_log')
            .select('*')
            .eq('student_id', studentId)
            .order('order_date', { ascending: false });

        if (error) throw error;

        const history: HistoryRecord[] = (data || []).map(item => ({
            id: item.order_id,
            bento: item.bento_type,
            date: item.order_date,
            status: item.status ? '完了' : '未完了'
        }));

        return { success: true, history };
    } catch (error) {
        console.error("getHistoryAction error:", error);
        return { success: false, history: [] };
    }
}

/**
 * 予約実行
 */
export async function reserveAction(userId: string, bentoType: string, date: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, message: 'ユーザーIDが不正です' };

        // 重複チェック
        const { data: existing } = await supabaseClient
            .from('order_log')
            .select('order_id')
            .eq('student_id', studentId)
            .eq('order_date', date)
            .single();

        if (existing) return { success: false, message: 'この日は既に予約済みです' };

        const { error } = await supabaseClient
            .from('order_log')
            .insert([{ 
                student_id: studentId, 
                bento_type: bentoType, 
                order_date: date,
                status: true 
            }]);

        if (error) throw error;

        revalidatePath('/');
        return { success: true, message: '予約が完了しました' };
    } catch (error) {
        return { success: false, message: '予約処理に失敗しました' };
    }
}