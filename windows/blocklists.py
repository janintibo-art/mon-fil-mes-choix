# -*- coding: utf-8 -*-
"""Optional third-party advertising-domain lists. Explicit opt-in, safe parsing, bounded size."""
import os
import tempfile
import urllib.request
from pathlib import Path

SOURCES = {
    "adaway": ("AdAway — publicités", "https://raw.githubusercontent.com/AdAway/adaway.github.io/master/hosts.txt"),
    "stevenblack": ("StevenBlack — publicité et logiciels indésirables", "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"),
}
MAX_FILE_BYTES = 6_000_000
MAX_RULES_PER_SOURCE = 10_000


def parse_hosts(text, normalize_fn, max_rules=MAX_RULES_PER_SOURCE):
    """Parse hosts (0.0.0.0 / 127.0.0.1) and simple domain-only lists.

    Not an Adblock Plus parser: unsupported cosmetic or network directives are ignored.
    """
    found = set()
    truncated = False
    for raw in text.splitlines():
        line = raw.strip().split('#',1)[0].strip()
        if not line or line.startswith(('!', '[', '||', '@@', '||', '/')):
            continue
        fields = line.split()
        if len(fields) > 1:
            if fields[0] not in ('0.0.0.0', '127.0.0.1', '::', '::1'):
                continue
            candidates = fields[1:]
        else:
            candidates = fields
        for candidate in candidates:
            candidate = candidate.lower().removeprefix('*.')
            if candidate in ('localhost','localhost.localdomain','local'):
                continue
            valid, errors = normalize_fn(candidate)
            if valid and not errors:
                for domain in valid:
                    if domain in found:
                        continue
                    if len(found) >= max_rules:
                        truncated = True
                        return sorted(found), truncated
                    found.add(domain)
    return sorted(found), truncated


def cache_path(data_dir, source):
    if source not in SOURCES:
        raise ValueError('Source inconnue')
    return Path(data_dir) / ('pub_' + source + '.txt')


def cached(data_dir, source):
    path = cache_path(data_dir, source)
    try:
        lines = path.read_text(encoding='utf-8').splitlines()
        return [line for line in lines if line]
    except OSError:
        return []


def fetch_source(data_dir, source, normalize_fn, opener=urllib.request.urlopen):
    if source not in SOURCES:
        raise ValueError('Source non autorisée')
    url = SOURCES[source][1]
    request = urllib.request.Request(url, headers={'User-Agent':'MonFilMesChoix/15 (user initiated)'})
    with opener(request, timeout=18) as response:
        data = response.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise ValueError('Liste trop volumineuse : maximum 6 Mo')
    domains, truncated = parse_hosts(data.decode('utf-8-sig', errors='replace'), normalize_fn)
    if not domains:
        raise ValueError('Aucun domaine valide trouvé : fichier refusé')
    directory = Path(data_dir);directory.mkdir(parents=True, exist_ok=True)
    dest = cache_path(directory, source)
    fd, tmp = tempfile.mkstemp(dir=str(directory), prefix=dest.name+'.', suffix='.tmp', text=True)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write('\n'.join(domains) + '\n')
        os.replace(tmp, dest)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
    return len(domains), truncated


def enabled_domains(data_dir, flags):
    result = set()
    for source in SOURCES:
        if flags.get(source, False):
            result.update(cached(data_dir, source))
    return result
