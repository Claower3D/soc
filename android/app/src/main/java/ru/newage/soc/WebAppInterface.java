package ru.newage.soc;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

public class WebAppInterface {
    private final Context mContext;

    public WebAppInterface(Context context) {
        this.mContext = context;
    }

    @JavascriptInterface
    public void showToast(String message) {
        if (message != null && !message.isEmpty()) {
            Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show();
        }
    }

    @JavascriptInterface
    public void vibrate(int milliseconds) {
        try {
            Vibrator v = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(milliseconds);
                }
            }
        } catch (Exception ignored) {
        }
    }

    @JavascriptInterface
    public String getAppVersion() {
        return "1.0.0 (Native Android)";
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public void share(String title, String text) {
        try {
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            sendIntent.putExtra(Intent.EXTRA_TEXT, text);
            sendIntent.putExtra(Intent.EXTRA_TITLE, title);
            sendIntent.setType("text/plain");
            Intent shareIntent = Intent.createChooser(sendIntent, title);
            shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            mContext.startActivity(shareIntent);
        } catch (Exception ignored) {
        }
    }
}
