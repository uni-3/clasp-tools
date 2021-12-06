function setEnv() {
  // 取得するカレンダーIDの一覧
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    subscribes: "xxxx@google.com,xxxx@google.com",
  });
}
