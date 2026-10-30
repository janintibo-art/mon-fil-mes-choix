package org.monfilmeschoix.dns;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

/** Fichier commun, lisible hors connexion, sans téléchargement ni compte. */
final class ChoiceTransfer {
    static final String FORMAT="mon-fil-mes-choix-preferences";
    static final int VERSION=1;
    static String exportJson(SelectionRules selection, String manual) throws Exception {
        JSONObject doc=new JSONObject();
        doc.put("format",FORMAT);doc.put("version",VERSION);
        JSONArray off=new JSONArray();
        ArrayList<Integer> sorted=new ArrayList<>(selection.excluded);
        java.util.Collections.sort(sorted);
        for(Integer i:sorted)off.put(i);
        doc.put("excluded_ids",off);
        JSONArray domains=new JSONArray();
        for(String d:selection.manualDomains(manual))domains.put(d);
        doc.put("custom_domains",domains);
        return doc.toString(2);
    }
    static final class Data {
        final Set<Integer> excluded;
        final Set<String> domains;
        Data(Set<Integer> e,Set<String> d){excluded=e;domains=d;}
    }
    static Data parse(String text, SelectionRules selection) throws Exception {
        if(text.length()>100000)throw new IllegalArgumentException("Fichier trop volumineux");
        JSONObject doc=new JSONObject(text);
        if(!FORMAT.equals(doc.optString("format")) || doc.optInt("version",-1)!=VERSION)
            throw new IllegalArgumentException("Sauvegarde incompatible");
        JSONArray ids=doc.getJSONArray("excluded_ids"), raw=doc.getJSONArray("custom_domains");
        if(ids.length()>303 || raw.length()>1000)throw new IllegalArgumentException("Trop d'éléments");
        HashSet<Integer> known=new HashSet<>();for(SelectionRules.Entry e:selection.entries)known.add(e.id);
        HashSet<Integer> excluded=new HashSet<>();
        for(int i=0;i<ids.length();i++){
            Object val=ids.get(i);if(!(val instanceof Integer))throw new IllegalArgumentException("Numéro invalide");
            int id=(Integer)val;if(!known.contains(id)||!excluded.add(id))throw new IllegalArgumentException("Choix invalide");
        }
        HashSet<String> domains=new HashSet<>();
        for(int i=0;i<raw.length();i++){
            String item=raw.getString(i);
            Set<String> parsed=DomainRules.parse(item);
            if(parsed.size()!=1 || !parsed.iterator().next().equals(item) || !domains.add(item))
                throw new IllegalArgumentException("Domaine invalide");
        }
        return new Data(excluded,domains);
    }
}
