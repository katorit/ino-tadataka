# 伊能忠敬 記念碑巡りマップ

伊能忠敬およびゆかりの人物に関する記念碑・史跡を地図上で巡る React + Vite + Firebase アプリです。

## 開発

```sh
npm install
npm run dev
```

## Firebase

このリポジトリには Firebase Web config と Google Maps API key が含まれます。どちらもクライアントアプリでは公開される値ですが、公開前に Google Cloud Console で API key のアプリケーション制限と API 制限を設定してください。

管理者権限は個人メールアドレスではなく Firebase Authentication の custom claim で判定します。管理者ユーザーには `admin: true` claim を付与してください。

Firestore Rules では `request.auth.token.admin == true` のユーザーだけが記念碑データを追加・編集できます。

## ローカル設定

問い合わせ先メールを画面に出したい場合は、Git に含めないローカル環境ファイルで設定します。

```sh
cp .env.example .env.local
```

`.env.local`:

```env
VITE_CONTACT_EMAIL=public-contact@example.com
```

## GitHub 公開時の注意

`node_modules/`, `dist/`, `.firebase/`, `*.log`, `.env.*` は `.gitignore` で除外しています。`firebase-debug.log` には Firebase CLI のログインユーザー情報が含まれるため、公開リポジトリには含めないでください。
