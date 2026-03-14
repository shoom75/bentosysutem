'use server'

import { supabase as supabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface HistoryRecord {
    id: number;
    bento: string;
    date: string;
    status: string;
}

// --- ログイン ---
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
        return { success: true, user: { id: data.id, num: data.num, building_id: data.building_id } };
    } catch (e) {
        return { success: false, error: '通信エラーが発生しました' };
    }
}

// --- 履歴取得（有効な予約のみ） ---
export async function getHistoryAction(userId: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, history: [] };
        const { data, error } = await supabaseClient
            .from('order_log')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', true)
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
        return { success: false, history: [] };
    }
}

// --- 予約実行・キャンセル（論理削除） ---
export async function reserveAction(userId: string, bentoType: string, date: string) {
    try {
        const studentId = parseInt(userId, 10);
        if (isNaN(studentId)) return { success: false, message: "不正なユーザーIDです" };

        // 1. .single()を使わず、配列で取得（データ0件でもエラーにならない）
        const { data: orders, error: fetchError } = await supabaseClient
            .from('order_log')
            .select('*')
            .eq('student_id', studentId)
            .eq('order_date', date);

        if (fetchError) throw fetchError;

        // 配列の1番目があれば既存予約あり
        const existingOrder = orders && orders.length > 0 ? orders[0] : null;

        if (existingOrder) {
            // 2. 予約がある場合：statusを反転させる（論理削除/復元）
            const nextStatus = !existingOrder.status;
            const { error } = await supabaseClient
                .from('order_log')
                .update({ status: nextStatus })
                .eq('order_id', existingOrder.order_id);
            
            if (error) throw error;
            return { 
                success: true, 
                message: nextStatus ? "予約を復元しました" : "予約をキャンセルしました" 
            };
        } else {
            // 3. 予約がない場合：新規登録
            const { error } = await supabaseClient
                .from('order_log')
                .insert([
                    { student_id: studentId, bento_type: bentoType, order_date: date, status: true }
                ]);

            if (error) throw error;
            return { success: true, message: "予約が完了しました" };
        }
    } catch (error) {
        console.error("reserveAction error:", error);
        return { success: false, message: "処理に失敗しました" };
    }
}