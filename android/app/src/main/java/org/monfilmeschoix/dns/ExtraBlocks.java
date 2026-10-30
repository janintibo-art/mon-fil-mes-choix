package org.monfilmeschoix.dns;

import android.content.Context;
import android.content.SharedPreferences;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

/** Optional public advertising blocklists. Download only on explicit user request. */
final class ExtraBlocks {
    static final String[] KEYS={"adaway","stevenblack"};
    static final String[] LABELS={"AdAway · publicités","StevenBlack · publicités et trackers"};
    static final String[] URLS={
        "https://raw.githubusercontent.com/AdAway/adaway.github.io/master/hosts.txt",
        "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
    };
    static final int MAX_RULES=10000;
    private static final int MAX_BYTES=6000000;
    private static final String PREF="pub_v15";
    private static volatile Set<String> currentActive = null;
    private ExtraBlocks(){}

    static boolean enabled(Context c,int i){return c.getSharedPreferences(PREF,0).getBoolean(KEYS[i],false);}
    static void setEnabled(Context c,int i,boolean enabled){
        c.getSharedPreferences(PREF,0).edit().putBoolean(KEYS[i],enabled).apply();
        currentActive=null;
    }
    static File file(Context c,int i){return new File(c.getFilesDir(),"pub_"+KEYS[i]+".txt");}

    static Set<String> cached(Context c,int i){
        LinkedHashSet<String> out=new LinkedHashSet<>();
        File path=file(c,i);
        if (!path.isFile()) return out;
        try(BufferedReader br=new BufferedReader(new InputStreamReader(new java.io.FileInputStream(path),StandardCharsets.UTF_8))){
            String line;
            while((line=br.readLine())!=null && out.size()<MAX_RULES){
                out.addAll(DomainRules.parse(line));
            }
        }catch(Exception error){android.util.Log.w("MFMC-Ads","Cannot read cached list",error);}
        return out;
    }
    static synchronized Set<String> active(Context c){
        if(currentActive!=null)return currentActive;
        HashSet<String> out=new HashSet<>();
        for(int i=0;i<KEYS.length;i++)if(enabled(c,i))out.addAll(cached(c,i));
        currentActive=out;return currentActive;
    }
    static Set<String> all(Context c, String manual){
        HashSet<String> out=new HashSet<>(new SelectionRules(c).effectiveDomains(manual));
        out.addAll(active(c));return out;
    }
    static final class Result {int count; boolean limited;Result(int n,boolean b){count=n;limited=b;}}
    static Result download(Context ctx, int index) throws Exception {
        if(index<0 || index>=URLS.length)throw new IllegalArgumentException("Source inconnue");
        HttpURLConnection conn=(HttpURLConnection)new URL(URLS[index]).openConnection();
        conn.setConnectTimeout(12000);conn.setReadTimeout(18000);
        conn.setInstanceFollowRedirects(false); // avoid moving outside the trusted HTTPS domain
        conn.setRequestProperty("User-Agent","MonFilMesChoix/15");
        LinkedHashSet<String> out=new LinkedHashSet<>();boolean limited=false;
        try {
            if(conn.getResponseCode()!=200)throw new java.io.IOException("HTTP " + conn.getResponseCode());
            int bytes=0;
            try(BufferedReader br=new BufferedReader(new InputStreamReader(conn.getInputStream(),StandardCharsets.UTF_8))){
                String line;
                while((line=br.readLine())!=null){
                    bytes += line.length()+1;
                    if(bytes>MAX_BYTES)throw new java.io.IOException("Liste trop volumineuse (6 Mo maximum)");
                    String raw=line.split("#",2)[0].trim();
                    if(raw.isEmpty() || raw.startsWith("!") || raw.startsWith("||") || raw.startsWith("@@"))continue;
                    String[] parts=raw.split("\\s+");
                    int start=0;
                    if(parts.length>1){
                        if(parts[0].equals("0.0.0.0") || parts[0].equals("127.0.0.1") || parts[0].equals("::"))start=1;
                        else continue;
                    }
                    for(int k=start;k<parts.length;k++){
                        String candidate=parts[k].toLowerCase(java.util.Locale.ROOT);
                        if(candidate.equals("localhost") || candidate.equals("localhost.localdomain"))continue;
                        Set<String> parsed=DomainRules.parse(candidate);
                        for(String item:parsed){
                            out.add(item);
                            if(out.size()>MAX_RULES){out.remove(item);limited=true;break;}
                        }
                        if(limited)break;
                    }
                    if(limited)break;
                }
            }
        }finally{conn.disconnect();}
        if(out.isEmpty())throw new java.io.IOException("Aucun domaine valide reçu");
        File target=file(ctx,index),tmp=new File(ctx.getFilesDir(),"pub_"+KEYS[index]+".tmp");
        try(BufferedWriter bw=new BufferedWriter(new OutputStreamWriter(new java.io.FileOutputStream(tmp),StandardCharsets.UTF_8))){
            for(String domain:out){bw.write(domain);bw.newLine();}
        }
        if(!tmp.renameTo(target)){
            // Only replace cached list after validated download completes.
            if(target.exists() && !target.delete())throw new java.io.IOException("Impossible de remplacer la liste");
            if(!tmp.renameTo(target))throw new java.io.IOException("Impossible d'enregistrer la liste");
        }
        currentActive=null;
        return new Result(out.size(),limited);
    }
}
