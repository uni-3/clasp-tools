//連携アプリ情報
const Client_ID = "ここにClient IDを設定";
const Client_Secret = "ここにClient Secretを設定";
const host = "https://api.freee.co.jp/api/1/";

// スクリプトへのアクセスを許可する認証URLを取得
function Auth() {
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
function authCallback(request: object) {
  const service = getService();
  const isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return "認証に成功しました";
  } else {
    return "認証に失敗しました";
  }
}

/*
  APIの実行
*/

// アクセス先に応じてレスポンス取得
function getResource(path: string) {
  let service = getService();
  if (!service.hasAccess()) {
    let authUrl = service.getAuthorizationUrl();
    Logger.log("Open the following URL and re-run the script: %s", authUrl);
    throw new Error("アクセストークンがありません");
  }

  let url = host + path;
  let res = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + service.getAccessToken(),
    },
  });

  return JSON.parse(res.getContentText());
}

function main() {
  let companies = "companies";
  let res = getResource(companies);
  // TODO: レスポンス確認
  let company_id = res.companies[0].id;

  // TODO: その他APIの取得と加工
}
