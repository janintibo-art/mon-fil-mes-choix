package org.monfilmeschoix.dns;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.HashSet;
import java.util.Set;

/** 303 selected by default. Only entries with known domains affect DNS. */
final class SelectionRules {
    static final class Entry {
        final int id;
        final String name, group, domain;
        Entry(int id, String name, String group, String domain) {
            this.id=id; this.name=name; this.group=group; this.domain=domain;
        }
    }
    private static final String PREF="selection_v14";
    private static final String KEY="excluded_ids";
    final ArrayList<Entry> entries = new ArrayList<>();
    final LinkedHashMap<String,ArrayList<Entry>> groups = new LinkedHashMap<>();
    final HashSet<Integer> excluded = new HashSet<>();
    final Context context;

    SelectionRules(Context context) {
        this.context=context.getApplicationContext();
        try (InputStream in=context.getAssets().open("selection_v14.json");
             ByteArrayOutputStream buffer=new ByteArrayOutputStream()) {
            byte[] bytes=new byte[4096]; int n;
            while((n=in.read(bytes))>0) buffer.write(bytes,0,n);
            JSONObject root=new JSONObject(buffer.toString("UTF-8"));
            JSONArray data=root.getJSONArray("entries");
            for (int i=0;i<data.length();i++) {
                JSONObject row=data.getJSONObject(i);
                Entry entry=new Entry(row.getInt("id"), row.getString("name"),
                                      row.getString("group"), row.optString("domain",""));
                entries.add(entry);
                if(!groups.containsKey(entry.group)) groups.put(entry.group,new ArrayList<>());
                groups.get(entry.group).add(entry);
            }
        } catch(Exception error) {
            android.util.Log.e("MFMC-Selection","Unable to load selection data",error);
            throw new IllegalStateException("Impossible de charger les 303 entrées",error);
        }
        try {
            JSONArray off=new JSONArray(context.getSharedPreferences(PREF,Context.MODE_PRIVATE).getString(KEY,"[]"));
            for (int i=0;i<off.length();i++) excluded.add(off.getInt(i));
        } catch(Exception error) {
            android.util.Log.w("MFMC-Selection","Invalid saved selection",error);
        }
    }
    boolean isSelected(int id){return !excluded.contains(id);}
    int countSelected(){return entries.size()-excluded.size();}
    int groupSelected(String name){
        int n=0; for(Entry e:groups.get(name)) if(isSelected(e.id)) n++; return n;
    }
    void setSelected(int id,boolean on){if(on) excluded.remove(id); else excluded.add(id); save();}
    void setGroup(String name,boolean on){
        for(Entry e:groups.get(name)) if(on) excluded.remove(e.id);else excluded.add(e.id);
        save();
    }
    void selectAll(boolean on){
        excluded.clear();
        if(!on)for(Entry e:entries) excluded.add(e.id);
        save();
    }
    void save(){
        JSONArray values=new JSONArray();
        for(int id:excluded)values.put(id);
        context.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit().putString(KEY,values.toString()).apply();
    }
    void replaceExcluded(Set<Integer> selectedOff) {
        HashSet<Integer> valid=new HashSet<>();
        for(Entry e:entries)valid.add(e.id);
        if(!valid.containsAll(selectedOff))throw new IllegalArgumentException("Identifiants inconnus");
        excluded.clear();excluded.addAll(selectedOff);save();
    }
    Set<String> domains(){
        LinkedHashSet<String> result=new LinkedHashSet<>();
        for(Entry e:entries) if(isSelected(e.id) && !e.domain.isEmpty()) result.add(e.domain);
        return result;
    }
    /** Legacy domain preference contained the 9 built-in defaults. Treat those as
     * group-managed rather than manual entries so switches can really disable them. */
    Set<String> manualDomains(String value){
        Set<String> parsed=DomainRules.parse(value);
        HashSet<String> defaults=new HashSet<>();
        for(Entry e:entries)if(!e.domain.isEmpty()) defaults.add(e.domain);
        parsed.removeAll(defaults);
        return parsed;
    }
    Set<String> effectiveDomains(String oldDomainText){
        LinkedHashSet<String> set=new LinkedHashSet<>(domains());
        set.addAll(manualDomains(oldDomainText));
        return set;
    }
}
