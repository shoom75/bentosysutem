"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // さっき作ったファイル

export default function TestPage() {
  const [data, setData] = useState<any[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      // user_list からデータを1件取ってみる
      const { data: userList, error } = await supabase
        .from("user_list")
        .select("*")
        .limit(1);
      
      if (error) console.error("エラー:", error);
      else setData(userList);
    }
    fetchData();
  }, []);

  return (
    <div className="p-10">
      <h1>Supabase接続テスト</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {data ? <p className="text-green-500">✅ 接続成功！</p> : <p>読み込み中...</p>}
    </div>
  );
}