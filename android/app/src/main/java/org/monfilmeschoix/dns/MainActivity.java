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
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private EditText domains;
    private TextView state;
    private final int accent = Color.rgb(89, 226, 191);
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setStatusBarColor(Color.rgb(12, 17, 29));
        getWindow().setNavigationBarColor(Color.rgb(12, 17, 29));
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true); scroll.setBackgroundColor(Color.rgb(12,17,29));
        LinearLayout main = new LinearLayout(this); main.setOrientation(LinearLayout.VERTICAL);
        main.setPadding(dp(22),dp(32),dp(22),dp(22)); scroll.addView(main);
        TextView tag = text("MON FIL, MES CHOIX  /  DNS", 12, accent, true); main.addView(tag);
        TextView title = text("Choisissez les sites à masquer", 29, Color.WHITE, true); title.setPadding(0,dp(12),0,dp(12)); main.addView(title);
        TextView intro = text("Filtre DNS local : bloque les domaines et sous-domaines, pas les personnes présentes dans une publication. Aucune collecte de votre navigation.", 15, 0xffb6c3d1, false); main.addView(intro);
        state = text("Filtre arrêté", 16, accent, true); state.setPadding(0,dp(22),0,dp(12)); main.addView(state);
        TextView hint = text("Un domaine par ligne. Modifiable à tout moment :", 15, Color.WHITE, true); hint.setPadding(0,dp(8),0,dp(8)); main.addView(hint);
        domains = new EditText(this); domains.setTextColor(Color.WHITE); domains.setHintTextColor(0xff8e9bad);
        domains.setTextSize(15); domains.setTypeface(Typeface.MONOSPACE); domains.setGravity(Gravity.TOP | Gravity.START);
        domains.setMinLines(10); domains.setBackground(rounded(0xff1d2938, 16));
        domains.setPadding(dp(15),dp(15),dp(15),dp(15)); domains.setText(DomainRules.get(this));
        main.addView(domains, new LinearLayout.LayoutParams(-1,dp(260)));
        Button save = button("Enregistrer la liste", 0xff22334a, Color.WHITE); main.addView(save); save.setOnClickListener(v -> saveDomains());
        Button start = button("Activer le filtre DNS", accent, 0xff0b1421); main.addView(start);
        start.setOnClickListener(v -> {
            saveDomains();
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED)
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 12);
            Intent permission = VpnService.prepare(this);
            if (permission != null) startActivityForResult(permission, 7); else startVpn();
        });
        Button stop = button("Désactiver", 0xff513040, Color.WHITE); main.addView(stop);
        stop.setOnClickListener(v -> { startService(new Intent(this,DnsVpnService.class).setAction(DnsVpnService.STOP)); state.setText("Filtre arrêté"); });
        TextView footer = text("Android affichera une demande d'autorisation VPN : c'est nécessaire pour intercepter uniquement les requêtes DNS. Le service n'est pas un VPN d'anonymisation. Un autre VPN ne peut généralement pas fonctionner simultanément. Le DNS privé, le DNS chiffré d'un navigateur et certaines applications peuvent contourner ce filtre. En cas de panne réseau, utilisez Désactiver dans l'application ou les réglages VPN Android.", 13, 0xffa2afc0, false);
        footer.setPadding(0,dp(20),0,0); main.addView(footer);
        setContentView(scroll);
    }
    private void saveDomains() {
        String value = domains.getText().toString();
        java.util.Set<String> list = DomainRules.parse(value);
        getSharedPreferences("dns", MODE_PRIVATE).edit().putString(DomainRules.KEY, String.join("\n",list)).apply();
        Toast.makeText(this,list.size() + " domaines enregistrés",Toast.LENGTH_SHORT).show();
    }
    private void startVpn() {
        Intent intent = new Intent(this, DnsVpnService.class).setAction(DnsVpnService.START);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent); else startService(intent);
        state.setText("Activation demandée — vérifiez la notification");
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if(request == 7 && result == RESULT_OK) startVpn();
        else if(request == 7) state.setText("Autorisation VPN refusée");
    }
    private TextView text(String content,int sp,int color,boolean bold) {
        TextView t = new TextView(this);t.setText(content);t.setTextSize(sp);t.setTextColor(color);
        if(bold)t.setTypeface(null,Typeface.BOLD);return t;
    }
    private Button button(String label,int bg,int fg){
        Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTextSize(15);b.setTextColor(fg);b.setBackground(rounded(bg,14));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(50));p.topMargin=dp(10);b.setLayoutParams(p);return b;
    }
    private GradientDrawable rounded(int color, int r) { GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(r));return d; }
    private int dp(int v){return Math.round(getResources().getDisplayMetrics().density * v);}
}
