# イントロドン！ - リアルタイム対戦イントロクイズ

遠隔の2人がリアルタイムで対戦するイントロクイズWebアプリです。

## セットアップ

### 必要なもの
- Node.js 18以上
- npm

### インストール & 起動

```bash
# 1. 依存パッケージを一括インストール
npm run install:all

# 2. 開発サーバー起動（サーバー + クライアント同時起動）
npm run dev
```

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3001

### 本番ビルド & 起動

```bash
# ビルド
npm run build

# 起動（Express がフロントも配信）
npm start
```

http://localhost:3001 にアクセスすると動作します。

## リモート対戦する方法

2人が別のPCから対戦するには、サーバーをインターネットに公開する必要があります。

### 方法 1: ngrok（最も簡単）

```bash
# サーバー起動後に別ターミナルで
npx ngrok http 3001
```
表示されたURLを相手に共有すれば対戦可能。

### 方法 2: Render にデプロイ（無料）

1. このプロジェクトをGitHubリポジトリにpush
2. [Render](https://render.com) でアカウント作成
3. New > Web Service を選択
4. リポジトリを接続し、以下を設定:
   - **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**: `NODE_ENV=production`

### 方法 3: Railway にデプロイ

1. [Railway](https://railway.app) でプロジェクト作成
2. GitHubリポジトリを接続
3. 同様のビルド設定で自動デプロイ

## 遊び方

1. 一方が「ルームを作成する」でルーム作成
2. 表示されたルームID（6桁）を相手に伝える
3. 相手が「ルームに参加する」でルームIDを入力
4. 2人揃ったらホストがジャンル・年代・問題数・制限時間を設定
5. 「ゲームスタート！」で対戦開始
6. イントロが流れたら早押しボタンを押して曲名を回答！

## 技術スタック

- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **Frontend**: React + Vite + Tailwind CSS + TypeScript
- **外部API**: Deezer API（認証不要・30秒プレビュー音源）
