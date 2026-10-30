package org.monfilmeschoix.dns;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import java.util.LinkedHashSet;
import java.util.Set;

/** Local opt-in diagnostic history. Never records allowed lookups. */
final class BlockHistory {
    private static final String PREF="block_history_v20", ENABLED="enabled", HISTORY="events", ALLOW="allow";
    private BlockHistory() {}
    static boolean enabled(Context ctx) {return ctx.getSharedPreferences(PREF,0).getBoolean(ENABLED,false);}
    static void setEnabled(Context ctx,boolean value) {ctx.getSharedPreferences(PREF,0).edit().putBoolean(ENABLED,value).apply();}
    static synchronized void record(Context ctx,String domain) {
        if(!enabled(ctx))return;
        SharedPreferences sp=ctx.getSharedPreferences(PREF,0);
        try {
            JSONArray old=new JSONArray(sp.getString(HISTORY,"[]"));
            JSONArray updated=new JSONArray();
            int start=Math.max(0,old.length()-98);
            for(int i=start;i<old.length();i++) updated.put(old.getJSONObject(i));
            org.json.JSONObject item=new org.json.JSONObject();
            item.put("host",domain); item.put("time",System.currentTimeMillis());
            updated.put(item);
            sp.edit().putString(HISTORY,updated.toString()).apply();
        }catch(Exception ignored) {}
    }
    static String report(Context ctx) {
        try {
            JSONArray data=new JSONArray(ctx.getSharedPreferences(PREF,0).getString(HISTORY,"[]"));
            if(data.length()==0)return "Aucun domaine bloqué enregistré.";
            StringBuilder out=new StringBuilder();
            java.text.SimpleDateFormat fmt=new java.text.SimpleDateFormat("dd/MM HH:mm",java.util.Locale.FRANCE);
            for(int i=data.length()-1;i>=0;i--){
                org.json.JSONObject row=data.getJSONObject(i);
                out.append(fmt.format(new java.util.Date(row.getLong("time")))).append(" · ").append(row.getString("host")).append("\n");
            }
            return out.toString();
        }catch(Exception error){return "Historique indisponible.";}
    }
    static void clear(Context ctx) {ctx.getSharedPreferences(PREF,0).edit().remove(HISTORY).apply();}
    static Set<String> exceptions(Context ctx){
        LinkedHashSet<String> result=new LinkedHashSet<>();
        try {
            JSONArray arr=new JSONArray(ctx.getSharedPreferences(PREF,0).getString(ALLOW,"[]"));
            for(int i=0;i<arr.length();i++)result.add(arr.getString(i));
        }catch(Exception ignored){} return result;
    }
    static void addException(Context ctx,String domain){
        Set<String> rules=exceptions(ctx);rules.add(domain);
        JSONArray arr=new JSONArray();for(String r:rules)arr.put(r);
        ctx.getSharedPreferences(PREF,0).edit().putString(ALLOW,arr.toString()).apply();
    }
    static void removeException(Context ctx,String domain){
        Set<String> rules=exceptions(ctx);rules.remove(domain);
        JSONArray arr=new JSONArray();for(String r:rules)arr.put(r);
        ctx.getSharedPreferences(PREF,0).edit().putString(ALLOW,arr.toString()).apply();
    }
    static boolean isAllowed(Context ctx,String host){
        for(String rule:exceptions(ctx))if(host.equals(rule)||host.endsWith("."+rule))return true;
        return false;
    }
}
