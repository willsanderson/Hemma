#!/usr/bin/env python3
"""Bundle the button-card templates and view scaffolding for the Hemma panel.

Run from the repo root after changing anything under dashboards/templates/:

    python3 tools/build-templates.py
"""

import json
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "dashboards/hemma/hemma.yaml.example")
OUT = os.path.join(ROOT, "custom_components/hemma/panel/hemma-templates.json")


class HALoader(yaml.SafeLoader):
    pass


def _resolve(path, base):
    if path.startswith("/config/"):
        return os.path.join(ROOT, path[len("/config/"):])
    return path if os.path.isabs(path) else os.path.join(base, path)


def _load(path):
    with open(path, encoding="utf-8") as f:
        loader = HALoader(f)
        loader.name = path
        try:
            return loader.get_single_data()
        finally:
            loader.dispose()


def _include(loader, node):
    return _load(_resolve(loader.construct_scalar(node), os.path.dirname(loader.name)))


def _include_dir_merge_named(loader, node):
    root = _resolve(loader.construct_scalar(node), os.path.dirname(loader.name))
    merged = {}
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in sorted(filenames):
            if not fn.endswith(".yaml"):
                continue
            data = _load(os.path.join(dirpath, fn))
            if not isinstance(data, dict):
                continue
            for key in data:
                if key in merged:
                    print(f"  ! duplicate template '{key}' in {fn}", file=sys.stderr)
            merged.update(data)
    return merged


HALoader.add_constructor("!include", _include)
HALoader.add_constructor("!include_dir_merge_named", _include_dir_merge_named)


def main():
    cfg = _load(SRC)

    templates = cfg.get("button_card_templates")
    if not templates:
        sys.exit("no button_card_templates in " + SRC)

    home = next((v for v in cfg.get("views", []) if v.get("path") == "home"), None)
    if home is None:
        sys.exit("no view with path 'home' in " + SRC)

    cards = home.get("cards") or []
    if len(cards) < 3:
        sys.exit(f"home view has {len(cards)} cards, expected at least 3")

    bundle = {
        "version": "1",
        "templates": templates,
        "scaffold": {
            "view_type": home["type"],
            "layout": home["layout"],
            "nav": cards[1],
        },
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(bundle, f, ensure_ascii=False, separators=(",", ":"))

    print(f"wrote {os.path.relpath(OUT, ROOT)}")
    print(f"  {os.path.getsize(OUT):,} bytes")
    print(f"  templates: {len(templates)}")


if __name__ == "__main__":
    main()
