package ru.newage.soc;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.webkit.WebViewAssetLoader;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    public static final String LIVE_SERVER_URL = "https://soc-production-9d33.up.railway.app";
    public static final String LOCAL_OFFLINE_URL = "https://appassets.androidplatform.net/index.html";

    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;
    private static final int PERMISSIONS_REQUEST_CODE = 1002;

    private WebView mWebView;
    private ValueCallback<Uri[]> mFilePathCallback;
    private long mBackPressedTime = 0;
    private boolean mIsOfflineFallback = false;

    @SuppressLint({"SetJavaScriptEnabled", "RequiresFeature"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make status bar clean white with dark icons
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            window.setStatusBarColor(ContextCompat.getColor(this, R.color.status_bar_color));
        }

        mWebView = new WebView(this);
        setContentView(mWebView);

        checkAndRequestPermissions();

        // Enable cookies and third-party cookies for persistent PostgreSQL sessions
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(mWebView, true);
        }

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Add custom UA identifier
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " NewAgeApp/1.0.0 (Android; LiveDBSync)");

        // Add native bridge
        mWebView.addJavascriptInterface(new WebAppInterface(this), "Android");

        // Set up WebViewAssetLoader for secure local origin fallback
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain("appassets.androidplatform.net")
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        mWebView.setWebViewClient(new WebViewClient() {
            @Nullable
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("appassets.androidplatform.net".equals(url.getHost())) {
                    WebResourceResponse response = assetLoader.shouldInterceptRequest(url);
                    if (response != null) {
                        return response;
                    }

                    // SPA Fallback: for client-side routes (e.g. /feed, /messenger, /clips, /editor)
                    String path = url.getPath();
                    if (path == null || !path.contains(".")) {
                        try {
                            InputStream is = getAssets().open("index.html");
                            return new WebResourceResponse("text/html", "UTF-8", is);
                        } catch (IOException ignored) {
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                injectBridgeScripts(view);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectBridgeScripts(view);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    if (!mIsOfflineFallback) {
                        mIsOfflineFallback = true;
                        view.loadUrl(LOCAL_OFFLINE_URL);
                        Toast.makeText(MainActivity.this, "Сервер временно недоступен. Запущен автономный режим.", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if (scheme != null && !scheme.startsWith("http")) {
                    // Open tel:, mailto:, tg:, etc. in external app
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                    }
                }
                return false;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            // File picker support (<input type="file">)
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                }
                mFilePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    mFilePathCallback = null;
                    Toast.makeText(MainActivity.this, "Не удалось открыть выбор файлов", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }

            // WebRTC Camera & Microphone permission support
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        // Initialize smart sync: live server with PostgreSQL by default, offline fallback if disconnected
        if (isNetworkAvailable()) {
            mIsOfflineFallback = false;
            mWebView.loadUrl(LIVE_SERVER_URL);
        } else {
            mIsOfflineFallback = true;
            mWebView.loadUrl(LOCAL_OFFLINE_URL);
            Toast.makeText(this, "Автономный режим (нет сети). Данные синхронизируются при подключении.", Toast.LENGTH_LONG).show();
        }
    }

    private void injectBridgeScripts(WebView view) {
        if (view == null) return;
        view.evaluateJavascript(
                "try {" +
                "  window.__NATIVE_ANDROID__ = true;" +
                "  if (!window.__API_BASE__) window.__API_BASE__ = '" + LIVE_SERVER_URL + "';" +
                "} catch(e) {}",
                null
        );
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network activeNetwork = cm.getActiveNetwork();
                if (activeNetwork != null) {
                    NetworkCapabilities capabilities = cm.getNetworkCapabilities(activeNetwork);
                    return capabilities != null && (
                            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
                    );
                }
            } else {
                NetworkInfo activeNetworkInfo = cm.getActiveNetworkInfo();
                return activeNetworkInfo != null && activeNetworkInfo.isConnected();
            }
        }
        return false;
    }

    private void checkAndRequestPermissions() {
        List<String> permissions = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_IMAGES);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_VIDEO);
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
        }

        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), PERMISSIONS_REQUEST_CODE);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (mFilePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            if (mBackPressedTime + 2000 > System.currentTimeMillis()) {
                super.onBackPressed();
            } else {
                Toast.makeText(this, getString(R.string.press_again_to_exit), Toast.LENGTH_SHORT).show();
                mBackPressedTime = System.currentTimeMillis();
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) {
            mWebView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }
}
