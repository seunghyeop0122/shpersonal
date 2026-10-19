# -*- coding: utf-8 -*-
"""
채용공고 자동 수집 — 사람인 오픈 API → Supabase public.job_postings
(Python 3 표준 라이브러리만 사용. GitHub Actions 에서 매일 실행)

조건
  · 직무: CATEGORIES 의 키워드별로 검색 (구매·조달 / 해외영업 / 사업기획·상사 / 마케팅)
  · 범위: 코스피 상장사(stock=kospi) · 정규직(job_type=1) · 헤드헌팅/파견 제외(sr=directhire)
  · 신입: API에 경력 필터가 없어 응답의 experience-level 로 거른다
          (1 신입, 3 신입/경력, 0 경력무관만 남김)

필요한 값 (GitHub 저장소 Settings → Secrets → Actions, 또는 로컬 .env)
  SARAMIN_ACCESS_KEY        사람인 오픈API 키
  SUPABASE_SERVICE_ROLE_KEY Supabase secret(service_role) 키
  SUPABASE_URL              (선택) 없으면 assets/js/supabase-config.js 에서 읽음

키가 없으면 실패하지 않고 건너뛴다(키 발급 전에도 워크플로가 빨간불이 되지 않게).
키 값은 어디에도 출력하지 않는다.
"""
import sys, os, io, re, json, time, urllib.request, urllib.parse, urllib.error
from datetime import datetime, timezone, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://oapi.saramin.co.kr/job-search"

# 사이트 필터 칩 이름 → 검색 키워드
CATEGORIES = {
    "구매·조달": ["구매", "조달"],
    "해외영업": ["해외영업", "글로벌영업"],
    "사업기획·상사": ["사업기획", "전략기획", "상사"],
    "마케팅·브랜드": ["마케팅", "브랜드"],
}
NEWBIE_CODES = {"1", "3", "0"}   # 신입 / 신입·경력 / 경력무관
PAGES = 2                         # 키워드당 최대 2페이지 × 110건
EXPIRED_KEEP_DAYS = 3             # 마감 후 며칠 지나면 삭제


def load_env():
    env = dict(os.environ)
    path = os.path.join(ROOT, ".env")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8-sig"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    if not env.get("SUPABASE_URL"):
        cfg = open(os.path.join(ROOT, "assets", "js", "supabase-config.js"), encoding="utf-8").read()
        m = re.search(r"https://[a-z0-9]+\.supabase\.co", cfg)
        env["SUPABASE_URL"] = m.group(0) if m else ""
    return env


def http(method, url, headers=None, data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise RuntimeError("%s %s -> %s %s" % (method, url.split("?")[0], e.code, e.read().decode("utf-8", "replace")[:300]))


def search(key, keyword, start):
    q = urllib.parse.urlencode({
        "access-key": key,
        "keywords": keyword,
        "stock": "kospi",
        "sr": "directhire",
        "job_type": "1",
        "sort": "pd",
        "count": 110,
        "start": start,
        "fields": "posting-date,expiration-date",
    })
    res = http("GET", API + "?" + q, {"Accept": "application/json"})
    jobs = (res or {}).get("jobs") or {}
    return jobs.get("job") or [], int(jobs.get("total") or 0)


def ts(v):
    try:
        return datetime.fromtimestamp(int(v), tz=timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def name(obj):
    return (obj or {}).get("name") or ""


def to_row(job):
    pos = job.get("position") or {}
    company = ((job.get("company") or {}).get("detail") or {}).get("name") or ""
    return {
        "source": "saramin",
        "source_id": str(job.get("id")),
        "company": company,
        "title": pos.get("title") or "",
        "url": job.get("url") or "",
        "job_type": name(pos.get("job-type")),
        "experience": name(pos.get("experience-level")),
        "education": name(pos.get("required-education-level")),
        "location": name(pos.get("location")).replace("&gt;", ">"),
        "industry": name(pos.get("industry")),
        "posted_at": ts(job.get("posting-timestamp")),
        "deadline": ts(job.get("expiration-timestamp")),
        "close_type": name(job.get("close-type")),
    }


def is_newbie(job):
    lv = ((job.get("position") or {}).get("experience-level") or {}).get("code")
    return str(lv) in NEWBIE_CODES


def main():
    env = load_env()
    key = env.get("SARAMIN_ACCESS_KEY")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key or not sb_key or not env.get("SUPABASE_URL"):
        print("[건너뜀] SARAMIN_ACCESS_KEY / SUPABASE_SERVICE_ROLE_KEY 가 아직 설정되지 않았습니다.")
        return

    rows = {}  # source_id -> row (여러 키워드에 걸리면 categories 를 합침)
    for cat, keywords in CATEGORIES.items():
        for kw in keywords:
            for page in range(PAGES):
                jobs, total = search(key, kw, page)
                for job in jobs:
                    if not is_newbie(job) or not job.get("active", 1):
                        continue
                    row = rows.setdefault(str(job.get("id")), to_row(job))
                    row.setdefault("categories", [])
                    if cat not in row["categories"]:
                        row["categories"].append(cat)
                if (page + 1) * 110 >= total:
                    break
                time.sleep(0.3)
            print("  %-8s %-6s → 누적 %d건" % (cat, kw, len(rows)))

    base = env["SUPABASE_URL"].rstrip("/") + "/rest/v1/job_postings"
    headers = {
        "apikey": sb_key,
        "Authorization": "Bearer " + sb_key,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    now = datetime.now(timezone.utc).isoformat()
    payload = [dict(r, fetched_at=now) for r in rows.values()]
    for i in range(0, len(payload), 200):
        http("POST", base + "?on_conflict=source,source_id", headers, payload[i:i + 200])

    cutoff = (datetime.now(timezone.utc) - timedelta(days=EXPIRED_KEEP_DAYS)).isoformat()
    http("DELETE", base + "?deadline=lt." + urllib.parse.quote(cutoff),
         {k: v for k, v in headers.items() if k != "Content-Type"})

    print("[수집 완료] %d건 반영, 마감 %d일 지난 공고 정리" % (len(payload), EXPIRED_KEEP_DAYS))


if __name__ == "__main__":
    main()
