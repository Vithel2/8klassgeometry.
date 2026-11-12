package ru.geometry.trainer;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state); web = new WebView(this); setContentView(web);
  web.setOnApplyWindowInsetsListener((view, insets) -> {
   view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
   return insets;
  });
  setSystemTheme(false);
  web.addJavascriptInterface(new Object() {
   @JavascriptInterface public void setDarkMode(boolean dark) {
    runOnUiThread(() -> setSystemTheme(dark));
   }
  }, "AndroidTheme");
  web.getSettings().setJavaScriptEnabled(true);
  web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false);
  web.getSettings().setAllowContentAccess(false);
  web.setWebViewClient(new WebViewClient() {
   @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
  });
  web.loadUrl("file:///android_asset/index.html");
 }
 private void setSystemTheme(boolean dark) {
  int color = Color.parseColor(dark ? "#101725" : "#f3f6fc");
  getWindow().setStatusBarColor(color);
  getWindow().setNavigationBarColor(color);
  int flags = dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
  if (!dark && Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
  getWindow().getDecorView().setSystemUiVisibility(flags);
 }
 @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
 @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}
