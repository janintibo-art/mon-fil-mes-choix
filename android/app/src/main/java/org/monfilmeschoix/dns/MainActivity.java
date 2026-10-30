package org.monfilmeschoix.dns;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.VpnService;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/** V9 visual redesign. Keeps the same locally controlled DNS/VPN filtering. */
public class MainActivity extends Activity {
    private static final int BG = 0xff0b0e13;
    private static final int CARD = 0xff171e27;
    private static final int CARD_ALT = 0xff202a35;
    private static final int LINE = 0xff303b49;
    private static final int FG = 0xfff6f8fa;
    private static final int MUTED = 0xffa9b7c6;
    private static final int RED = 0xffed233e;
    private static final int GREEN = 0xff47daa2;
    private EditText domains;
    private TextView state, detail, counter;
    private final android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(18), dp(22), dp(18), dp(28));
        scroll.addView(page);

        // Brand header with the same red/black flag as the site.
        LinearLayout hero = panel(new int[]{0xff3b1320, 0xff151a24}, 22, 0xff60303e);
        hero.setPadding(dp(18), dp(19), dp(18), dp(19));
        page.addView(hero, lp(-1, -2, 0, 0, 0, 15));
        LinearLayout brand = horizontal();
        hero.addView(brand);
        ImageView flag = new ImageView(this);
        flag.setImageResource(R.drawable.icone_antifa);
        flag.setScaleType(ImageView.ScaleType.FIT_CENTER);
        brand.addView(flag, new LinearLayout.LayoutParams(dp(68), dp(68)));
        LinearLayout brandText = vertical();
        brandText.setPadding(dp(13), 0, 0, 0);
        brand.addView(brandText, new LinearLayout.LayoutParams(0, -2, 1));
        brandText.addView(text("MON FIL, MES CHOIX", 19, FG, true));
        brandText.addView(text("FILTRE DNS  /  ANDROID", 11, 0xffffa7b4, true), lp(-1,-2,0,5,0,0));
        hero.addView(text("Votre navigation, vos règles.", 23, FG, true), lp(-1,-2,0,19,0,5));
        hero.addView(text("Choisissez les domaines à filtrer. Vos règles restent sur cet appareil ; les requêtes autorisées utilisent des DNS publics.", 14, 0xffd9dfe8, false));

        // Display actual service state; never invent analytics or fake counters.
        LinearLayout status = panel(CARD, 19, LINE);
        page.addView(status, lp(-1,-2,0,0,0,12));
        status.addView(text("ÉTAT DE LA PROTECTION", 11, MUTED, true));
        state = text("○ Filtre désactivé", 22, MUTED, true);
        status.addView(state, lp(-1,-2,0,8,0,3));
        detail = text("Activez le filtre pour démarrer le VPN DNS local.", 13, MUTED, false);
        status.addView(detail);

        LinearLayout stats = horizontal();
        page.addView(stats, lp(-1,-2,0,0,0,13));
        LinearLayout countCard = panel(CARD, 16, LINE);
        stats.addView(countCard, new LinearLayout.LayoutParams(0, -2, 1));
        countCard.addView(text("DOMAINES CONFIGURÉS", 10, MUTED, true));
        counter = text("0", 23, FG, true);
        countCard.addView(counter, lp(-1,-2,0,6,0,0));
        View gap = new View(this);
        stats.addView(gap, new LinearLayout.LayoutParams(dp(10), dp(1)));
        LinearLayout modeCard = panel(CARD, 16, LINE);
        stats.addView(modeCard, new LinearLayout.LayoutParams(0, -2, 1));
        modeCard.addView(text("TECHNOLOGIE", 10, MUTED, true));
        modeCard.addView(text("DNS local", 19, FG, true), lp(-1,-2,0,9,0,2));
        modeCard.addView(text("Via VPN Android", 11, MUTED, false));

        // Primary controls stay clearly separated and require explicit user action.
        Button start = button("ACTIVER LA PROTECTION", RED, Color.WHITE, false);
        page.addView(start, lp(-1,dp(54),0,2,0,9));
        start.setOnClickListener(v -> {
            if (!saveDomains(false)) return;
            if (DomainRules.parse(domains.getText().toString()).isEmpty()) {
                Toast.makeText(this, "Ajoutez un domaine avant d'activer", Toast.LENGTH_LONG).show();
                return;
            }
            hideKeyboard();
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED)
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 12);
            Intent permission = VpnService.prepare(this);
            if (permission != null) startActivityForResult(permission, 7);
            else startVpn();
        });
        Button stop = button("Désactiver le filtre", CARD_ALT, FG, true);
        page.addView(stop, lp(-1,dp(49),0,0,0,16));
        stop.setOnClickListener(v -> {
            startService(new Intent(this, DnsVpnService.class).setAction(DnsVpnService.STOP));
            detail.setText("Arrêt demandé…");
            handler.postDelayed(this::refreshStatus, 600);
        });

        // Domain list — user remains in control of every rule.
        LinearLayout rules = panel(CARD, 19, LINE);
        page.addView(rules, lp(-1,-2,0,0,0,12));
        rules.addView(text("Liste des domaines", 20, FG, true));
        rules.addView(text("Un domaine par ligne. Ajoutez ou retirez des sites librement.",
                13, MUTED, false), lp(-1,-2,0,4,0,12));
        domains = new EditText(this);
        domains.setTextColor(FG);
        domains.setHintTextColor(MUTED);
        domains.setTextSize(15);
        domains.setTypeface(Typeface.MONOSPACE);
        domains.setGravity(Gravity.TOP | Gravity.START);
        domains.setPadding(dp(13),dp(13),dp(13),dp(13));
        domains.setBackground(shape(0xff10161e, 14, LINE));
        domains.setSingleLine(false);
        domains.setVerticalScrollBarEnabled(true);
        domains.setText(DomainRules.get(this));
        domains.setContentDescription("Liste des domaines à filtrer, un par ligne");
        rules.addView(domains, new LinearLayout.LayoutParams(-1, dp(230)));
        domains.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int start,int count,int after){}
            public void onTextChanged(CharSequence s,int start,int before,int count){
                if (counter != null) counter.setText(String.valueOf(DomainRules.parse(s.toString()).size()));
            }
            public void afterTextChanged(Editable e){}
        });
        counter.setText(String.valueOf(DomainRules.parse(domains.getText().toString()).size()));
        Button save = button("Enregistrer la liste", CARD_ALT, FG, true);
        rules.addView(save, lp(-1,dp(49),0,12,0,0));
        save.setOnClickListener(v -> saveDomains(true));
        rules.addView(text("Après modification, réactivez le filtre pour charger la nouvelle liste.",
                12, MUTED, false), lp(-1,-2,0,11,0,0));

        LinearLayout help = panel(CARD, 19, LINE);
        page.addView(help, lp(-1,-2,0,0,0,12));
        help.addView(text("Comment ça marche ?", 19, FG, true));
        help.addView(text("01  Choisissez les domaines à filtrer.\n02  Enregistrez et activez le filtre.\n03  Autorisez le VPN local demandé par Android.\n04  Désactivez-le à tout moment avec le bouton ci-dessus.",
                14, FG, false), lp(-1,-2,0,11,0,0));
        help.addView(text("Ce filtre DNS masque des domaines, pas des personnes sur un réseau social. Il ne s'agit pas d'un VPN d'anonymisation. Certains navigateurs avec DNS chiffré et le DNS privé peuvent contourner le filtrage. Un autre VPN peut être incompatible.",
                13, MUTED, false), lp(-1,-2,0,15,0,0));

        page.addView(text("MON FIL, MES CHOIX  •  FILTRAGE LOCAL ET RÉVERSIBLE", 10, MUTED, true),
                lp(-1,-2,0,6,0,0));
        setContentView(scroll);
        refreshStatus();
    }

    private boolean saveDomains(boolean toast) {
        java.util.Set<String> list = DomainRules.parse(domains.getText().toString());
        getSharedPreferences("dns", MODE_PRIVATE).edit().putString(DomainRules.KEY, String.join("\n", list)).apply();
        if (toast) Toast.makeText(this, list.size() + " domaines enregistrés", Toast.LENGTH_SHORT).show();
        counter.setText(String.valueOf(list.size()));
        return true;
    }

    private void hideKeyboard() {
        View focus = getCurrentFocus();
        if (focus != null) {
            InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) imm.hideSoftInputFromWindow(focus.getWindowToken(), 0);
            focus.clearFocus();
        }
    }

    private void startVpn() {
        Intent intent = new Intent(this, DnsVpnService.class).setAction(DnsVpnService.START);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent); else startService(intent);
        state.setText("◌ Démarrage demandé");
        state.setTextColor(MUTED);
        detail.setText("Vérifiez l'indication VPN dans Android et la notification.");
        handler.postDelayed(this::refreshStatus, 900);
    }

    private void refreshStatus() {
        if (state == null || detail == null) return;
        boolean on = DnsVpnService.ACTIVE;
        state.setText(on ? "● Protection active" : "○ Protection désactivée");
        state.setTextColor(on ? GREEN : MUTED);
        detail.setText(on ? "Service DNS local en cours d'exécution." : "Filtre arrêté. Activez-le quand vous le souhaitez.");
    }

    @Override protected void onResume() {super.onResume();handler.postDelayed(this::refreshStatus, 200);}
    @Override protected void onDestroy() {handler.removeCallbacksAndMessages(null);super.onDestroy();}
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == 7 && result == RESULT_OK) startVpn();
        else if (request == 7 && detail != null) detail.setText("Autorisation VPN refusée.");
    }

    private LinearLayout vertical() {LinearLayout v = new LinearLayout(this);v.setOrientation(LinearLayout.VERTICAL);return v;}
    private LinearLayout horizontal() {LinearLayout v = new LinearLayout(this);v.setOrientation(LinearLayout.HORIZONTAL);v.setGravity(Gravity.CENTER_VERTICAL);return v;}
    private TextView text(String label, int sp, int color, boolean bold) {
        TextView t = new TextView(this);t.setText(label);t.setTextSize(sp);t.setTextColor(color);
        t.setLineSpacing(dp(2), 1f);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return t;
    }
    private LinearLayout panel(int bg, int radius, int border) {
        LinearLayout layout = vertical();layout.setPadding(dp(16),dp(17),dp(16),dp(17));
        layout.setBackground(shape(bg,radius,border));return layout;
    }
    private LinearLayout panel(int[] gradient, int radius, int border) {
        LinearLayout layout = vertical();layout.setBackground(shape(gradient,radius,border));return layout;
    }
    private GradientDrawable shape(int color,int radius,int stroke) {
        GradientDrawable d = new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));
        d.setStroke(dp(1),stroke);return d;
    }
    private GradientDrawable shape(int[] colors,int radius,int stroke) {
        GradientDrawable d = new GradientDrawable(GradientDrawable.Orientation.TL_BR, colors);
        d.setCornerRadius(dp(radius));d.setStroke(dp(1),stroke);return d;
    }
    private Button button(String label,int bg,int color,boolean outline) {
        Button b = new Button(this);b.setText(label);b.setAllCaps(false);b.setTextSize(15);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);b.setTextColor(color);
        b.setBackground(shape(bg,14, outline ? LINE : RED));
        b.setElevation(dp(2));return b;
    }
    private LinearLayout.LayoutParams lp(int w,int h,int l,int t,int r,int b) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(w,h);
        p.setMargins(dp(l),dp(t),dp(r),dp(b));return p;
    }
    private int dp(int value) {return Math.round(value * getResources().getDisplayMetrics().density);}
}
