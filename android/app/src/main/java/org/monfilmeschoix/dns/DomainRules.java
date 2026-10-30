package org.monfilmeschoix.dns;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Pattern;

final class DomainRules {
    private static final Pattern VALID = Pattern.compile("(?i)(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}");
    static final String KEY = "domaines";
    private DomainRules() {}

    static String defaults(Context context) throws Exception {
        try (InputStream in = context.getAssets().open("domaines_v1.json"); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096]; int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            JSONArray data = new JSONArray(out.toString("UTF-8"));
            StringBuilder result = new StringBuilder();
            for (int i = 0; i < data.length(); i++) result.append(data.getJSONObject(i).getString("host")).append('\n');
            return result.toString();
        }
    }
    static String get(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences("dns", Context.MODE_PRIVATE);
        String saved = p.getString(KEY, null);
        if (saved != null) return saved;
        try { return defaults(ctx); } catch (Exception e) { return ""; }
    }
    static Set<String> parse(String raw) {
        Set<String> domains = new LinkedHashSet<>();
        for (String line : raw.split("\\R")) {
            String item = line.trim().toLowerCase(java.util.Locale.ROOT);
            if (item.startsWith("#") || item.isEmpty()) continue;
            if (item.startsWith("*.")) item = item.substring(2);
            if (VALID.matcher(item).matches()) domains.add(item);
        }
        return domains;
    }
    static boolean blocked(String host, Set<String> domains) {
        String name = host.toLowerCase(java.util.Locale.ROOT);
        for (String d : domains) if (name.equals(d) || name.endsWith("." + d)) return true;
        return false;
    }
}
