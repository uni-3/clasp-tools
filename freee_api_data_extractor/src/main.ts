/*
参照ライブラリ
title OAuth2
project_key 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
*/

//連携アプリ情報
const Client_ID = "ここにClient IDを設定";
const Client_Secret = "ここにClient Secretを設定";

function Auth() {
  //スクリプトへのアクセスを許可する認証URLを取得
  const authUrl = getService().getAuthorizationUrl();
  console.log(authUrl);
}

//freeeAPIのサービスを取得する関数
function getService() {
  return OAuth2.createService("freee")
    .setAuthorizationBaseUrl(
      "https://accounts.secure.freee.co.jp/public_api/authorize"
    )
    .setTokenUrl("https://accounts.secure.freee.co.jp/public_api/token")
    .setClientId(Client_ID)
    .setClientSecret(Client_Secret)
    .setCallbackFunction("authCallback")
    .setPropertyStore(PropertiesService.getUserProperties());
}

//認証コールバック関数
function authCallback(request) {
  const service = getService();
  const isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return "認証に成功しました";
  } else {
    return "認証に失敗しました";
  }
}

function getCompanies() {
  //freeeAPIからアクセストークンを取得
  const accessToken = getService().getAccessToken();

  //事業所一覧を取得するリクエストURL
  const requestUrl = "https://api.freee.co.jp/api/1/companies";

  //freeeAPIへのリクエストに付与するパラメータ
  const params = {
    method: "get",
    headers: { Authorization: "Bearer " + accessToken },
  };

  //リクエスト送信とレスポンス取得
  const response = UrlFetchApp.fetch(requestUrl, params).getContentText();
  console.log(response);
}
