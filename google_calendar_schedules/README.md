google calendar予定をbigqueryに抽出するスクリプト

google action script上で動く
#### 変数

取得するカレンダーの種類はプロパティにセットしている
projectのエディタから設定の変更を行う

### セットアップ

[clasp](https://github.com/google/clasp)を使用

nodejsをインストールして`npm install`を実行する

### ログイン

```sh
npm run login
```

でgoogleアカウントにログイン


### コードを更新する

```sh
npm run push
```

### projectを開く

関数の実行や、実行タイミングの変更、ログの確認などできる

```
npm run open
```

### 手元で動かす

エディタで動かさなくてよくなるのでちょっと便利

設定が必要。手順多いので割愛

 https://github.com/google/clasp#run

```
npm run r
```

で実行する関数を選ぶなどする
