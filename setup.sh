#!/bin/bash
# イントロドン！ セットアップスクリプト
echo "🎵 イントロドン！ セットアップ開始..."

echo ""
echo "📦 ルートの依存パッケージをインストール中..."
npm install

echo ""
echo "📦 サーバーの依存パッケージをインストール中..."
cd server && npm install && cd ..

echo ""
echo "📦 クライアントの依存パッケージをインストール中..."
cd client && npm install && cd ..

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "開発サーバーを起動するには:"
echo "  npm run dev"
echo ""
echo "本番ビルド + 起動するには:"
echo "  npm run build && npm start"
echo ""
