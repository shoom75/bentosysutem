from flask import Flask, request, jsonify  # jsonifyを追加
import pandas as pd
from datetime import datetime

app = Flask(__name__)

@app.route('/api/save', methods=['POST'])
def save_data():
    name = request.form.get('student_name')
    bento = request.form.get('bento_type')
    
    date = datetime.now().strftime("%m/%d")
    now = datetime.now().strftime("%H:%M")

    # Excel保存処理
    df = pd.DataFrame({"日付": [date], "時間": [now], "氏名": [name], "注文": [bento]})
    df.to_excel("result.xlsx", index=False)
    
    # 【重要】ブラウザに「データ」として返事をする
    return jsonify({
        "status": "success",
        "message": "Excelに保存しました",
        "received_data": {
            "name": name,
            "bento": bento,
            "time": f"{date} {now}"
        }
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)