#!/usr/bin/env python3
"""Guard the dashboard translation table.

    python3 tools/i18ncheck.py                # check everything, then show coverage
    python3 tools/i18ncheck.py --missing sv   # what sv.json still needs, ready to translate

en.json is the reference translators work from, so it has to agree with the
English default sitting inline at every call site. A drift there is invisible:
English users keep reading the inline default while translators translate a
string nobody sees.
"""

import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "custom_components/hemma/translations/dashboard")
OUT = os.path.join(ROOT, "custom_components/hemma/scripts/hemma-i18n.js")
SCAN = ("dashboards/templates", "custom_components/hemma/scripts", "custom_components/hemma/panel")

CALL = re.compile(
    r"(?:_hemmaT|(?<![\w$])T)\(\s*'([^']+)'\s*,\s*'((?:[^'\\]|\\.)*)'"
)
# The panel writes double quotes, but its schema also has a text-field factory
# called T("key", "Label"), so a double-quoted call counts only as _hemmaT or _studioT.
CALL_DQ = re.compile(
    r'(?:_hemmaT|_studioT)\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"'
)
SLOT = re.compile(r"\{(\w+)\}")
PANEL = os.path.join(ROOT, "custom_components/hemma/panel/hemma-panel.js")
STUDIO_OUT = os.path.join(ROOT, "custom_components/hemma/panel/hemma-studio-i18n.json")
# Studio text is looked up by its English, so it has no key at the call site.
DQ = r'"(?:[^"\\\n]|\\.)*"'
RUN = r"%s(?:\s*\+\s*%s)*" % (DQ, DQ)
SX = re.compile(r"(?<![\w$.])_sx\(\s*(%s)\s*[,)]" % RUN)
SCHEMA_PROP = re.compile(
    r"\b(?:label|hint|blurb|placeholder|unitLabel|emptyHint|entityLabel|entityPlaceholder"
    r"|add|noun|iconText|advancedLabel)\s*:\s*(%s)" % RUN)
SCHEMA_ARG = re.compile(r"\b(?:E|T|LIST|MAP|R)\(\s*\"[^\"]*\"\s*,\s*(%s)" % RUN)
# Names, not words: nothing to translate.
STUDIO_AS_IS = {"Inter", "Hanken Grotesk", "PlayStation", "PlayStation %", "Discord", "Steam",
                "Plex", "PM2.5", "PM10", "VOC", "CO2", "PC", "yourname, someone"}


def js_run(run):
    return "".join(json.loads(p) for p in re.findall(DQ, run))


def studio_errors(en):
    errors = []
    src = open(PANEL, encoding="utf-8").read()
    studio = {v: k for k, v in en.items() if k.startswith("studio.")}
    dupes = [k for k, v in en.items() if k.startswith("studio.") and studio[v] != k]
    for k in dupes:
        errors.append("en.json: %r repeats the English of %r" % (k, studio[en[k]]))
    line = lambda off: src.count("\n", 0, off) + 1
    for m in SX.finditer(src):
        t = js_run(m.group(1))
        if t not in studio:
            errors.append("hemma-panel.js:%d  _sx text not in en.json: %r" % (line(m.start()), t))
    a = src.index("const GROUPS = [")
    b = src.find("const MOBILE_TILE_FIELDS")
    if b < 0:
        b = src.index("\n];", a)
    for rx in (SCHEMA_PROP, SCHEMA_ARG):
        for m in rx.finditer(src, a, b):
            if src[m.end(1):m.end(1) + 8].lstrip().startswith("+"):
                continue
            t = js_run(m.group(1))
            if t and re.search(r"[A-Z]", t[:1]) and t not in studio and t not in STUDIO_AS_IS:
                errors.append("hemma-panel.js:%d  schema text not in en.json: %r" % (line(m.start()), t))
    literals = {js_run(m.group(0)) for m in re.finditer(RUN, src)}
    for t, k in sorted(studio.items(), key=lambda x: x[1]):
        if t not in literals and not t.startswith("Button %"):
            errors.append("en.json: %r (%r) is not in hemma-panel.js" % (k, t))
    return errors


def call_sites():
    for rel in SCAN:
        base = os.path.join(ROOT, rel)
        for dirpath, _d, files in os.walk(base):
            if "untested" in dirpath:
                continue
            for name in files:
                if not name.endswith((".yaml", ".js")):
                    continue
                if name == "hemma-i18n.js":
                    continue
                path = os.path.join(dirpath, name)
                try:
                    with open(path, encoding="utf-8", errors="replace") as fh:
                        text = fh.read()
                except OSError:
                    continue
                for rx in (CALL, CALL_DQ):
                    for m in rx.finditer(text):
                        line = text.count("\n", 0, m.start()) + 1
                        yield os.path.relpath(path, ROOT), line, m.group(1), m.group(2)


def main() -> int:
    errors = []
    with open(os.path.join(SRC, "en.json"), encoding="utf-8") as fh:
        en = json.load(fh)

    errors.extend(studio_errors(en))
    used = {k for k in en if k.startswith("studio.")}
    for path, line, key, default in call_sites():
        used.add(key)
        if key not in en:
            errors.append("%s:%d  key not in en.json: %r" % (path, line, key))
        elif en[key] != default:
            errors.append(
                "%s:%d  %r default %r != en.json %r"
                % (path, line, key, default, en[key])
            )

    for key in sorted(set(en) - used):
        errors.append("en.json: %r is not used at any call site" % key)

    for name in sorted(os.listdir(SRC)):
        if not name.endswith(".json") or name == "en.json":
            continue
        with open(os.path.join(SRC, name), encoding="utf-8") as fh:
            tbl = json.load(fh)
        for key, value in sorted(tbl.items()):
            if key not in en:
                errors.append("%s: %r is not in en.json" % (name, key))
                continue
            # In Studio labels like "Button %" the % is where Hemma writes the number.
            if isinstance(value, str) and en[key].count("%") != value.count("%"):
                errors.append("%s: %r has %d %% sign(s), en has %d"
                              % (name, key, value.count("%"), en[key].count("%")))
            if SLOT.findall(en[key]) and set(SLOT.findall(value)) != set(
                SLOT.findall(en[key])
            ):
                errors.append(
                    "%s: %r placeholders %s != en %s"
                    % (name, key, SLOT.findall(value), SLOT.findall(en[key]))
                )

    # T() is a per-block shim, not a global: a call in a block that does not
    # define it is a ButtonCardJSTemplateError on the dashboard, not a fallback.
    # Blocks nest, so each call is judged against the innermost block around it.
    for path in sorted(glob.glob(
            os.path.join(ROOT, "dashboards/templates/**/*.yaml"), recursive=True)):
        src = open(path, encoding="utf-8").read()
        spans, stack = [], []
        for m in re.finditer(r"\[\[\[|\]\]\]", src):
            if m.group() == "[[[":
                stack.append(m.start())
            elif stack:
                spans.append((stack.pop(), m.end()))
        def own_text(span):
            # A nested block's helper is not this block's helper: blank the children.
            a, b = span
            txt = list(src[a:b])
            for c in spans:
                if c != span and a < c[0] and c[1] <= b:
                    for i in range(c[0] - a, c[1] - a):
                        txt[i] = " "
            return "".join(txt)

        for helper in ("T", "L"):
            flagged = set()
            for m in re.finditer(r"(?<![\w$.])%s\('" % helper, src):
                inner = max((s for s in spans if s[0] <= m.start() < s[1]),
                            key=lambda s: s[0], default=None)
                if inner and "const %s =" % helper not in own_text(inner) and inner not in flagged:
                    flagged.add(inner)
                    errors.append("%s:%d calls %s() with no shim in that block"
                                  % (os.path.relpath(path, ROOT),
                                     src[:inner[0]].count("\n") + 1, helper))

    read = lambda p: open(p, encoding="utf-8").read() if os.path.isfile(p) else None
    before = (read(OUT), read(STUDIO_OUT))
    subprocess.run(
        [sys.executable, os.path.join(ROOT, "tools/build-i18n.py")],
        check=True, capture_output=True,
    )
    if before != (read(OUT), read(STUDIO_OUT)):
        errors.append("the built tables were stale; rebuilt. Commit the result.")

    for e in errors:
        print(e)
    print("i18ncheck: %d key(s), %d problem(s)" % (len(en), len(errors)))
    print_coverage(en)
    return 1 if errors else 0


def done_keys(en, tbl):
    return {k for k, v in tbl.items() if k in en and isinstance(v, str) and v.strip()}


def print_coverage(en):
    studio = {k for k in en if k.startswith("studio.")}
    dash = set(en) - studio
    langs = sorted(n[:-5] for n in os.listdir(SRC) if n.endswith(".json") and n != "en.json")
    if not langs:
        print("\ncoverage: no translations yet")
        return
    print("\ncoverage          dashboard            Hemma Studio          total")
    for lang in langs:
        try:
            with open(os.path.join(SRC, lang + ".json"), encoding="utf-8") as fh:
                done = done_keys(en, json.load(fh))
        except (OSError, ValueError):
            print("  %-8s  unreadable" % lang)
            continue
        cell = lambda d, t: "%4d of %-4d %3d%%" % (d, t, round(100 * d / t) if t else 100)
        print("  %-8s  %s   %s   %s" % (lang, cell(len(done & dash), len(dash)),
                                       cell(len(done & studio), len(studio)),
                                       cell(len(done), len(en))))


def print_missing(lang):
    with open(os.path.join(SRC, "en.json"), encoding="utf-8") as fh:
        en = json.load(fh)
    path = os.path.join(SRC, lang + ".json")
    tbl = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            tbl = json.load(fh)
    todo = {k: en[k] for k in sorted(en) if k not in done_keys(en, tbl)}
    print(json.dumps(todo, ensure_ascii=False, indent=2))
    print("%d of %d still in English for %s. Translate the text on the right and add "
          "these lines to %s.json." % (len(todo), len(en), lang, lang), file=sys.stderr)
    return 0


if __name__ == "__main__":
    if "--missing" in sys.argv[1:]:
        args = sys.argv[sys.argv.index("--missing") + 1:]
        if not args:
            print("usage: i18ncheck.py --missing <language>", file=sys.stderr)
            raise SystemExit(2)
        raise SystemExit(print_missing(args[0]))
    raise SystemExit(main())
