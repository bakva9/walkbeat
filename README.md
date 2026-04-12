# WalkBeat

散歩が音楽になるアプリ。歩いたルートから自動でメロディが生成される。

## Features

- GPS ログからペンタトニックスケールのメロディを自動生成
- 速度・加速度・曲率に応じたリズムと表現の変化
- セクション分析による伴奏の自動生成（Calm / Walk / Active / Break）
- 散歩中のリアルタイム軌跡表示
- 散歩履歴の保存と再生

## Tech Stack

- React + Vite + Tailwind CSS
- Capacitor (Android native)
- Web Audio API
- Leaflet + OpenStreetMap

## Android APK Install

### Download

[Latest release](https://github.com/bakva9/walkbeat/releases/latest) から APK をダウンロード。

### Install steps

1. ダウンロードした `.apk` ファイルを開く
2. 「この提供元のアプリを許可」を ON にする
   - 設定 → アプリ → 特別なアクセス → 不明なアプリのインストール → ブラウザ（またはファイルマネージャー）→ 許可
3. インストールをタップ
4. Google Play Protect の警告が出たら「インストールする」を選択
5. 初回起動時に位置情報の許可を求められるので「アプリの使用中のみ許可」を選択
6. **バックグラウンド GPS を有効にする（推奨）**:
   - 設定 → アプリ → ASHIOTO → 権限 → 位置情報 → **「常に許可」**に変更
   - これをしないと画面を閉じたときに GPS 記録が止まります
   - 初回ダイアログでは「常に許可」は選べないため、この手動設定が必要です

### Troubleshooting

| 問題 | 対処 |
|---|---|
| 「インストールがブロックされました」 | 設定 → 不明なアプリのインストール を確認 |
| Play Protect 警告 | 「詳細」→「インストールする」で続行 |
| 位置情報が取得できない | 端末の位置情報サービスが ON か確認 |
| 画面を閉じると GPS が止まる | 設定 → アプリ → ASHIOTO → 権限 → 位置情報 → 「常に許可」に変更 |
| 音が鳴らない | メディア音量が 0 でないか確認。結果画面で再生ボタンをタップ |

## Development

```bash
npm install
npm run dev          # dev server
npm run build        # production build
npx cap sync android # sync to Android
```

## Privacy

[Privacy Policy](PRIVACY.md)

## License

MIT
