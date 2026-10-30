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
import android.widget.CheckBox;
import android.app.AlertDialog;
import java.util.ArrayList;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
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
    private TextView state, detail, counter, selectionCounter;
    private SelectionRules selection;
    private final ExecutorService downloads = Executors.newSingleThreadExecutor();
    private TextView adStatus;
    private CheckBox[] adChecks = new CheckBox[ExtraBlocks.KEYS.length];
    private final android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        selection = new SelectionRules(this);
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
        countCard.addView(text("DOMAINES DNS ACTIFS", 10, MUTED, true));
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
            if (ExtraBlocks.all(this,domains.getText().toString()).isEmpty()) {
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
            // Stop the actual Android service, even if its DNS tunnel is blocked.
            stopService(new Intent(this, DnsVpnService.class));
            state.setText("○ Protection désactivée");
            state.setTextColor(MUTED);
            detail.setText("Arrêt demandé à Android. Si le VPN reste actif, désactivez-le dans les paramètres VPN.");
            handler.postDelayed(this::refreshStatus, 900);
        });

        // Group and entry management; all 303 are selected by default.
        LinearLayout choose = panel(CARD, 19, LINE);
        page.addView(choose, lp(-1,-2,0,0,0,12));
        choose.addView(text("Gérer les 303 entrées", 20, FG, true));
        choose.addView(text("9 groupes activés par défaut. Cochez ou décochez des groupes ou des noms, comme dans Tampermonkey.",
                13, MUTED, false), lp(-1,-2,0,4,0,11));
        selectionCounter = text("", 13, GREEN, true);
        choose.addView(selectionCounter, lp(-1,-2,0,0,0,10));
        Button groupButton = button("⚙ Gérer les groupes", RED, Color.WHITE, false);
        choose.addView(groupButton, lp(-1,dp(50),0,0,0,9));
        groupButton.setOnClickListener(v -> showGroupDialog());
        LinearLayout allBtns = horizontal();
        choose.addView(allBtns);
        Button all = button("Tout cocher", CARD_ALT, FG, true);
        Button none = button("Tout décocher", CARD_ALT, FG, true);
        allBtns.addView(all, new LinearLayout.LayoutParams(0,dp(47),1));
        allBtns.addView(none, new LinearLayout.LayoutParams(0,dp(47),1));
        all.setOnClickListener(v -> {selection.selectAll(true); updateSelectionCount(); applyActiveRules();});
        none.setOnClickListener(v -> {selection.selectAll(false); updateSelectionCount(); applyActiveRules();});
        choose.addView(text("Important : seuls les domaines identifiés (9 au départ) peuvent être filtrés par DNS. " +
                "Les autres noms restent sélectionnés dans le catalogue, sans blocage réseau tant qu'aucun domaine vérifié ne leur est associé.",
                12, MUTED, false), lp(-1,-2,0,12,0,0));

        // Domain list — user remains in control of additional rules.
        LinearLayout rules = panel(CARD, 19, LINE);
        page.addView(rules, lp(-1,-2,0,0,0,12));
        rules.addView(text("Domaines personnels supplémentaires", 20, FG, true));
        rules.addView(text("Facultatif : les domaines associés aux groupes sont ajoutés automatiquement.",
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
        domains.setText(String.join("\n",selection.manualDomains(DomainRules.get(this))));
        domains.setContentDescription("Liste des domaines à filtrer, un par ligne");
        rules.addView(domains, new LinearLayout.LayoutParams(-1, dp(230)));
        domains.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int start,int count,int after){}
            public void onTextChanged(CharSequence s,int start,int before,int count){
                if (counter != null) counter.setText(String.valueOf(totalDomainCount(s.toString())));
            }
            public void afterTextChanged(Editable e){}
        });
        updateSelectionCount();
        Button save = button("Enregistrer la liste", CARD_ALT, FG, true);
        rules.addView(save, lp(-1,dp(49),0,12,0,0));
        save.setOnClickListener(v -> saveDomains(true));
        rules.addView(text("Après modification, réactivez le filtre pour charger la nouvelle liste.",
                12, MUTED, false), lp(-1,-2,0,11,0,0));

        LinearLayout help = panel(CARD, 19, LINE);
        page.addView(help, lp(-1,-2,0,0,0,12));
        help.addView(text("Comment ça marche ?", 19, FG, true));
        help.addView(text("01  Les 303 entrées sont précochées.\n02  Choisissez vos groupes et noms, puis les domaines personnels éventuels.\n03  Autorisez le VPN DNS local Android et activez-le.\n04  Modifiez ou désactivez le filtre à tout moment.",
                14, FG, false), lp(-1,-2,0,11,0,0));
        help.addView(text("Ce filtre DNS masque des domaines, pas des personnes sur un réseau social. Il ne s'agit pas d'un VPN d'anonymisation. Certains navigateurs avec DNS chiffré et le DNS privé peuvent contourner le filtrage. Un autre VPN peut être incompatible.",
                13, MUTED, false), lp(-1,-2,0,15,0,0));

        addExtras(page);
        page.addView(text("MON FIL, MES CHOIX  •  FILTRAGE LOCAL ET RÉVERSIBLE", 10, MUTED, true),
                lp(-1,-2,0,6,0,0));
        setContentView(scroll);
        refreshStatus();
    }

    private void addExtras(LinearLayout page) {
        LinearLayout extras=panel(CARD,19,LINE);
        page.addView(extras,lp(-1,-2,0,0,0,14));
        extras.addView(text("Publicités et autres blocages",20,FG,true));
        extras.addView(text("OPTION FACULTATIVE · Désactivée au départ. Choisissez une source, puis téléchargez sa liste. " +
            "Les données sont stockées sur le téléphone. Maximum 10 000 domaines par source pour préserver les performances.",
            13,MUTED,false),lp(-1,-2,0,6,0,12));
        adStatus=text("",13,GREEN,true);extras.addView(adStatus,lp(-1,-2,0,0,0,9));
        for(int i=0;i<ExtraBlocks.KEYS.length;i++){
            final int index=i;
            LinearLayout row=panel(CARD_ALT,13,LINE);
            extras.addView(row,lp(-1,-2,0,0,0,9));
            CheckBox check=new CheckBox(this);
            check.setText(ExtraBlocks.LABELS[i]);check.setTextColor(FG);check.setTextSize(14);
            check.setButtonTintList(android.content.res.ColorStateList.valueOf(RED));
            check.setChecked(ExtraBlocks.enabled(this,i));adChecks[i]=check;
            row.addView(check);
            check.setOnCheckedChangeListener((b,on)->{
                if(on && ExtraBlocks.cached(this,index).isEmpty()){
                    b.setChecked(false);
                    Toast.makeText(this,"Téléchargez d'abord cette liste",Toast.LENGTH_SHORT).show();return;
                }
                ExtraBlocks.setEnabled(this,index,on);applyActiveRules();updateSelectionCount();updateAdStatus();
            });
            Button download=button("Télécharger / Actualiser la liste",CARD,FG,true);
            row.addView(download,lp(-1,dp(45),0,6,0,0));
            row.addView(text("Source : "+ExtraBlocks.URLS[i],11,MUTED,false));
            download.setOnClickListener(v->{
                new AlertDialog.Builder(this).setTitle("Télécharger une liste externe ?")
                    .setMessage(ExtraBlocks.URLS[index]+"\n\nCe téléchargement HTTPS est facultatif. Il peut masquer certains sites utiles.")
                    .setNegativeButton("Annuler",null)
                    .setPositiveButton("Télécharger",(dialog,which)->{
                        download.setEnabled(false);download.setText("Téléchargement en cours…");
                        downloads.execute(()->{
                            try{
                                ExtraBlocks.Result result=ExtraBlocks.download(getApplicationContext(),index);
                                runOnUiThread(()->{
                                    download.setEnabled(true);download.setText("Télécharger / Actualiser la liste");
                                    updateSelectionCount();updateAdStatus();
                                    new AlertDialog.Builder(this).setTitle("Liste téléchargée")
                                        .setMessage(result.count+" domaines enregistrés."+
                                            (result.limited?" Limite de 10 000 atteinte.":"")+
                                            "\nCochez cette liste pour l'activer. Les règles sont utilisées si le VPN DNS est activé.")
                                        .setPositiveButton("OK",null).show();
                                });
                            }catch(Exception error){
                                runOnUiThread(()->{
                                    download.setEnabled(true);download.setText("Télécharger / Actualiser la liste");
                                    new AlertDialog.Builder(this).setTitle("Téléchargement impossible")
                                        .setMessage(String.valueOf(error.getMessage()))
                                        .setPositiveButton("OK",null).show();
                                });
                            }
                        });
                    }).show();
            });
        }
        extras.addView(text("Ajouter un domaine personnalisé",17,FG,true),lp(-1,-2,0,10,0,2));
        extras.addView(text("Un domaine précis, par exemple ads.exemple.fr. Les mots-clés, profils et publications ne sont pas filtrables par DNS.",
            12,MUTED,false),lp(-1,-2,0,3,0,7));
        EditText custom=new EditText(this);
        custom.setSingleLine(true);custom.setTextColor(FG);custom.setHintTextColor(MUTED);
        custom.setTextSize(15);custom.setHint("pub.exemple.fr");custom.setBackground(shape(0xff10161e,14,LINE));
        custom.setPadding(dp(12),0,dp(12),0);
        extras.addView(custom,new LinearLayout.LayoutParams(-1,dp(52)));
        Button add=button("AJOUTER À MES BLOCAGES",RED,Color.WHITE,true);
        extras.addView(add,lp(-1,dp(48),0,9,0,0));
        add.setOnClickListener(v->{
            String value=custom.getText().toString().trim();
            Set<String> valid=DomainRules.parse(value);
            if(valid.size()!=1 || !valid.iterator().next().equalsIgnoreCase(value)){
                Toast.makeText(this,"Entrez un domaine valide (sans https:// ni /)",Toast.LENGTH_LONG).show();return;
            }
            Set<String> existing=selection.manualDomains(domains.getText().toString());
            existing.addAll(valid);
            domains.setText(String.join("\n",existing));
            saveDomains(false);custom.setText("");hideKeyboard();
            updateSelectionCount();
            Toast.makeText(this,"Domaine ajouté et enregistré",Toast.LENGTH_SHORT).show();
        });
        extras.addView(text("Les domaines personnalisés restent aussi modifiables dans l’éditeur principal. " +
            "Vous pouvez désactiver les listes publicitaires sans supprimer vos autres blocages.",
            12,MUTED,false),lp(-1,-2,0,10,0,0));
        updateAdStatus();
    }
    private void updateAdStatus(){
        if(adStatus == null)return;
        int count=ExtraBlocks.active(this).size();
        adStatus.setText(count+" domaines publicitaires activés"+(count==0?" · option inactive":""));
    }

    private int totalDomainCount(String manual){
        java.util.HashSet<String> set=new java.util.HashSet<>(selection.effectiveDomains(manual));
        set.addAll(ExtraBlocks.active(this));return set.size();
    }

    private void updateSelectionCount() {
        if(selectionCounter != null)selectionCounter.setText(selection.countSelected()+" / 303 entrées sélectionnées  •  "
                +selection.domains().size()+" domaine(s) associés");
        if(counter != null && domains != null)counter.setText(String.valueOf(totalDomainCount(domains.getText().toString())));
    }

    private void applyActiveRules() {
        if(DnsVpnService.ACTIVE) {
            startService(new Intent(this,DnsVpnService.class).setAction(DnsVpnService.RELOAD));
            if(detail!=null) detail.setText("Règles DNS mises à jour.");
        }
    }

    private void showGroupDialog() {
        ScrollView scroller=new ScrollView(this);
        LinearLayout list=vertical(); list.setPadding(dp(14),dp(12),dp(14),dp(12));
        list.setBackgroundColor(BG);scroller.addView(list);
        for(String group:selection.groups.keySet()) {
            ArrayList<SelectionRules.Entry> items=selection.groups.get(group);
            LinearLayout row=panel(CARD,14,LINE);
            list.addView(row,lp(-1,-2,0,0,0,9));
            CheckBox groupBox=new CheckBox(this);
            groupBox.setText(group+"  ("+selection.groupSelected(group)+"/"+items.size()+")");
            groupBox.setTextColor(FG);groupBox.setTextSize(14);
            groupBox.setButtonTintList(android.content.res.ColorStateList.valueOf(RED));
            groupBox.setChecked(selection.groupSelected(group)==items.size());
            row.addView(groupBox);
            groupBox.setOnCheckedChangeListener((button,checked)->{
                selection.setGroup(group,checked);
                groupBox.setText(group+"  ("+selection.groupSelected(group)+"/"+items.size()+")");
                updateSelectionCount();applyActiveRules();
            });
            Button details=button("Choisir les entrées ("+items.size()+")",CARD_ALT,FG,true);
            row.addView(details,lp(-1,dp(43),0,4,0,0));
            details.setOnClickListener(v -> showEntriesDialog(group,groupBox));
        }
        new AlertDialog.Builder(this).setTitle("Gérer les 9 groupes")
            .setView(scroller).setPositiveButton("Terminé",(d,w)->updateSelectionCount()).show();
    }

    private void showEntriesDialog(String group, CheckBox groupBox) {
        ScrollView scroll = new ScrollView(this);
        LinearLayout list=vertical();list.setPadding(dp(14),dp(8),dp(14),dp(8));
        list.setBackgroundColor(BG);scroll.addView(list);
        for(SelectionRules.Entry entry:selection.groups.get(group)){
            CheckBox checkbox=new CheckBox(this);
            checkbox.setText(entry.name + (entry.domain.isEmpty()?"  · sans domaine DNS":"  · "+entry.domain));
            checkbox.setTextColor(FG);checkbox.setTextSize(14);
            checkbox.setButtonTintList(android.content.res.ColorStateList.valueOf(RED));
            checkbox.setChecked(selection.isSelected(entry.id));
            checkbox.setPadding(dp(6),dp(5),dp(6),dp(5));
            list.addView(checkbox);
            checkbox.setOnCheckedChangeListener((button,checked)->{
                selection.setSelected(entry.id,checked);
                updateSelectionCount(); applyActiveRules();
                int selected=selection.groupSelected(group), count=selection.groups.get(group).size();
                groupBox.setOnCheckedChangeListener(null);
                groupBox.setChecked(selected==count);
                groupBox.setText(group+"  ("+selected+"/"+count+")");
                groupBox.setOnCheckedChangeListener((b,on)->{
                    selection.setGroup(group,on); updateSelectionCount();applyActiveRules();
                    groupBox.setText(group+"  ("+selection.groupSelected(group)+"/"+count+")");
                });
            });
        }
        new AlertDialog.Builder(this).setTitle(group).setView(scroll)
            .setPositiveButton("Fermer",(d,w)->updateSelectionCount()).show();
    }

    private boolean saveDomains(boolean toast) {
        java.util.Set<String> list = DomainRules.parse(domains.getText().toString());
        getSharedPreferences("dns", MODE_PRIVATE).edit().putString(DomainRules.KEY, String.join("\n", list)).apply();
        applyActiveRules();
        if (toast) Toast.makeText(this, list.size() + " domaine(s) personnels enregistrés", Toast.LENGTH_SHORT).show();
        updateSelectionCount();
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
    @Override protected void onDestroy() {handler.removeCallbacksAndMessages(null);downloads.shutdownNow();super.onDestroy();}
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
