"""dlserver 도서관 이름 → 시도/시군구 매핑(src/data/libraryRegions.json)을 만든다.

    curl -s http://localhost:3000/moduleList > /tmp/modules.json
    python3 scripts/build-library-regions.py /tmp/modules.json <전국도서관표준데이터.csv>

표준 데이터는 공공데이터포털의 "전국도서관표준데이터" CSV(cp949)다.
모듈이 바뀌면 다시 돌려 결과 JSON 을 커밋한다.
"""
import csv, json, os, re, sys
from collections import Counter, defaultdict

if len(sys.argv) not in (3, 4):
    sys.exit(__doc__)
mods = json.load(open(sys.argv[1]))
rows = list(csv.DictReader(open(sys.argv[2], encoding="cp949")))
out_path = sys.argv[3] if len(sys.argv) == 4 else os.path.join(
    os.path.dirname(__file__), "..", "src", "data", "libraryRegions.json")

def norm(s):
    s = re.sub(r"\(.*?\)", "", s)
    return re.sub(r"[\s·ㆍ\-_.,'\"]", "", s)

SIDO_ALIAS = {"전라북도": "전북특별자치도"}
# 이름은 시 하나지만 실제로는 시도 전체 도서관을 묶은 모듈
SIDO_WIDE_MODULES = {"제주시도서관"}

std = []
for r in rows:
    sido = r["시도명"].strip()
    sido = SIDO_ALIAS.get(sido, sido)
    # "청주시 청원구" 처럼 구가 붙은 시는 시 단위로 묶는다
    sgg = r["시군구명"].strip().split(" ")[0]
    if sgg == "없음":  # 세종은 시군구가 없다
        sgg = "세종시"
    std.append({"name": r["도서관명"], "n": norm(r["도서관명"]), "sido": sido, "sgg": sgg})

all_regions = sorted({(e["sido"], e["sgg"]) for e in std})
SIDO_SHORT = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천", "광주광역시": "광주",
              "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기", "강원특별자치도": "강원",
              "충청북도": "충북", "충청남도": "충남", "전북특별자치도": "전북", "전라남도": "전남", "경상북도": "경북",
              "경상남도": "경남", "제주특별자치도": "제주"}

def name_hint(module_name, exact_sidos):
    """모듈 이름에 든 시군구(오산시·광진구…) 또는 시도(대구·충청북도…)."""
    sgg_hits = [r for r in all_regions if len(r[1]) >= 2 and r[1] in module_name]
    if sgg_hits:
        # "성북구립" 안의 "북구" 처럼 짧은 이름이 함께 걸리면 가장 긴 이름만 남긴다
        longest = max(len(r[1]) for r in sgg_hits)
        sgg_hits = [r for r in sgg_hits if len(r[1]) == longest]
    # 구 이름이 여러 시도에 있으면(중구·강서구) 정확히 맞은 도서관이 많은 시도로 고른다
    if len({r for r in sgg_hits}) > 1 and exact_sidos:
        top = exact_sidos.most_common(1)[0][0]
        sgg_hits = [r for r in sgg_hits if r[0] == top]
    if len(sgg_hits) == 1:
        return sgg_hits[0][0], sgg_hits[0]
    for full, short in SIDO_SHORT.items():
        if full in module_name or module_name.startswith(short):
            return full, None
    return None, None
by_n = defaultdict(list)
for e in std:
    by_n[e["n"]].append(e)

def regions(cands):
    return sorted({(c["sido"], c["sgg"]) for c in cands})

result = {}
stats = Counter()
per_module = {}
for m in mods:
    libs = m["libraries"]
    exact = {}
    for lib in libs:
        rs = regions(by_n.get(norm(lib), []))
        if len(rs) == 1:
            exact[lib] = rs[0]
    sido_c = Counter(r[0] for r in exact.values())
    sgg_c = Counter(exact.values())

    # 모듈의 지역: 이름에 든 지역이 먼저, 없으면 정확히 맞은 도서관 3곳 이상의 80% 가 몰린 곳
    hint_sido, hint_sgg = name_hint(m["name"], sido_c)
    if hint_sgg:
        module_sgg = hint_sgg
    elif len(exact) >= 3 and sgg_c.most_common(1)[0][1] / len(exact) >= 0.8:
        module_sgg = sgg_c.most_common(1)[0][0]
    else:
        module_sgg = None
    if module_sgg:
        module_sido = module_sgg[0]
    elif hint_sido:
        module_sido = hint_sido
    elif exact and sido_c.most_common(1)[0][1] / len(exact) >= 0.9:
        module_sido = sido_c.most_common(1)[0][0]
    else:
        module_sido = None

    found = {}
    for lib in libs:
        # 1) 전국에 하나뿐인 이름. 모듈과 시도가 다르면 우연히 같은 이름으로 보고 버린다
        # 시군구 하나짜리 모듈이면 다른 시군구의 같은 이름(아름드리 작은도서관·위례도서관)도 버린다
        if lib in exact and (module_sido is None or exact[lib][0] == module_sido) and (
            not module_sgg or exact[lib] == module_sgg or m["name"] in SIDO_WIDE_MODULES
        ):
            found[lib] = (exact[lib], "exact")
            continue
        # 2) 모듈 지역 안에서 같은 이름이나 포함 관계인 이름
        if module_sgg:
            scope = [e for e in std if (e["sido"], e["sgg"]) == module_sgg]
        elif module_sido:
            scope = [e for e in std if e["sido"] == module_sido]
        else:
            scope = []
        n = norm(lib)
        cands = [e for e in scope if e["n"] == n]
        if not cands and len(n) >= 3:
            cands = [e for e in scope if n in e["n"] or (e["n"] in n and len(e["n"]) >= 4)]
        rs = regions(cands)
        if len(rs) == 1:
            found[lib] = (rs[0], "scoped")
        # 3) 모듈 지역으로
        elif module_sgg:
            found[lib] = (module_sgg, "module")
        elif module_sido:
            found[lib] = ((module_sido, None), "module-sido")

    for lib in libs:
        if lib in found:
            (sido, sgg), how = found[lib]
            result.setdefault(m["name"], {})[lib] = {"sido": sido, "sigungu": sgg, "how": how}
            stats[how] += 1
        else:
            stats["none"] += 1
    per_module[m["name"]] = {
        "total": len(libs),
        "matched": sum(1 for l in libs if l in found),
        "single_region": bool(module_sgg),
        "main": " ".join(module_sgg) if module_sgg else module_sido,
        "missing": [l for l in libs if l not in found],
    }

# 시도 → 시군구 → 모듈 → 도서관 이름. 시군구를 정하지 못한 도서관은 "" 아래에 둔다.
# 같은 이름의 도서관이 여러 모듈에 있어 모듈까지 남긴다 (마포·부평의 "해오름 작은도서관")
tree = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
for module, libs in result.items():
    for lib, r in libs.items():
        tree[r["sido"]][r["sigungu"] or ""][module].append(lib)
regions = {
    sido: {sgg: {module: sorted(names) for module, names in sorted(ms.items())} for sgg, ms in sorted(sggs.items())}
    for sido, sggs in sorted(tree.items())
}
with open(out_path, "w") as f:
    json.dump(regions, f, ensure_ascii=False, indent=1)
    f.write("\n")

total = sum(stats.values())
print("total", total, {k: f"{v} ({v*100/total:.1f}%)" for k, v in stats.items()})
for name, s in sorted(per_module.items()):
    if not s["single_region"]:
        print(f'여러 지역 모듈: {name} ({s["total"]}곳)')
    if s["missing"]:
        print(f'지역 없음: {name} {", ".join(s["missing"])}')
