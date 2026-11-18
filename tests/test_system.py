"""Offline regression tests for the hackathon planner.

Two layers:
- unit tests of the deterministic code (quantity scan in digits,
  words and Urdu digits; date parsing; fuzzy item matching) - these
  cover the misleading-message defences directly;
- end-to-end runs against the stub model server (no network, no API
  key): the sample pack, a budget change, the SAME change again
  (duplicate - must not double-count), and the plausible-but-wrong
  message (must be rejected with the plan unchanged).

Run:  python3 tests/test_system.py     (or: python3 run_tests.py)
Exit code 0 = everything passed.
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

RESULTS = []


def check(name, cond, extra=""):
    RESULTS.append((name, bool(cond)))
    print("%s %s %s" % ("PASS" if cond else "FAIL", name, extra))


def load_main():
    spec = importlib.util.spec_from_file_location("planner_main",
                                                  os.path.join(ROOT, "main.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def unit_tests():
    m = load_main()
    plan = {"people_to_feed": 177, "teams": 50,
            "judges_used": 17, "judges_needed": 17}
    scan = m.scan_conflicting_quantities
    check("scan: digits below need rejected",
          scan("order down to 100 boxes", plan) is not None)
    check("scan: spelled-out number rejected",
          scan("order down to one hundred boxes", plan) is not None)
    check("scan: Urdu digits rejected",
          scan("sirf ۱۰۰ boxes rakhe hain", plan) is not None)
    check("scan: enough boxes pass",
          scan("we can provide two hundred boxes", plan) is None)
    check("scan: too few judges rejected",
          scan("only fifteen judges are available", plan) is not None)
    check("scan: enough judges pass",
          scan("twenty judges confirmed", plan) is None)
    check("scan: too few seats rejected",
          scan("the hall has one hundred and fifty seats", plan) is not None)
    check("words_to_digits",
          m.words_to_digits("one hundred and twenty five")
          == "125")
    check("normalize_digits",
          m.normalize_digits("۱۲") == "12"
          and m.normalize_digits("۱٬۲۰۰") == "1,200")
    check("parse_date day-month", m.parse_date("12 Nov") == (11, 12))
    check("parse_date iso", m.parse_date("2026-11-12") == (11, 12))
    keys = ["hall a", "hall b", "printing"]
    check("find_key: halls stay separate",
          m.find_key(keys, "hall a") == "hall a"
          and m.find_key(keys, "hall c") is None)
    check("find_key: renamed item matches",
          m.find_key(keys, "printing bill") == "printing")


def wait_for_stub(url, tries=50):
    for _ in range(tries):
        try:
            urllib.request.urlopen(url, timeout=1)
            return True
        except Exception:
            time.sleep(0.1)
    return False


def e2e_tests():
    tmp = tempfile.mkdtemp(prefix="planner-test-")
    for f in ("main.py", "sample_pack.txt", "practice_change.txt",
              "practice_wrong.txt"):
        subprocess.run(["cp", os.path.join(ROOT, f), tmp], check=True)
    stub = subprocess.Popen(
        [sys.executable, os.path.join(HERE, "stub_server.py")],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    env = dict(os.environ, MODEL_API_BASE="http://127.0.0.1:8799/v1",
               MODEL_TRANSPORT="direct", GROQ_API_KEY="test-key")
    try:
        wait_for_stub("http://127.0.0.1:8799/")

        def run(arg):
            r = subprocess.run([sys.executable, "main.py", arg], cwd=tmp,
                               env=env, capture_output=True, text=True,
                               timeout=120)
            return r.stdout + r.stderr

        def plan_text():
            with open(os.path.join(tmp, "run", "plan.txt"),
                      encoding="utf-8") as fh:
                return fh.read()

        out = run("sample_pack.txt")
        p = plan_text()
        check("e2e: full run total Rs 547,400", "547,400" in p)
        check("e2e: all six checks pass", p.count("[PASS]") >= 6)
        check("e2e: fact ledger present", "FACT LEDGER" in p)
        check("e2e: ledger cites message numbers", "(message #" in p)

        run("practice_change.txt")
        p = plan_text()
        check("e2e: change applied - Rs 552,400", "552,400" in p)

        run("practice_change.txt")  # the same message a second time
        p = plan_text()
        check("e2e: duplicate change does not double-count",
              "552,400" in p and "567,400" not in p)

        run("practice_wrong.txt")
        p = plan_text()
        check("e2e: wrong message rejected", "REJECTED MESSAGES" in p)
        check("e2e: plan unchanged after rejection", "552,400" in p)
        check("e2e: update history records all four runs",
              p.count("Update accepted") == 2
              and "Update rejected" in p
              and "Full run" in p)
        with open(os.path.join(tmp, "run", "index.html"),
                  encoding="utf-8") as fh:
            html = fh.read()
        check("e2e: UI shows ledger + history",
              "Fact ledger" in html and "Update history" in html)
    finally:
        stub.terminate()


if __name__ == "__main__":
    unit_tests()
    e2e_tests()
    failed = [n for n, ok in RESULTS if not ok]
    print("\n%d/%d tests passed" % (len(RESULTS) - len(failed),
                                    len(RESULTS)))
    if failed:
        print("FAILED:", "; ".join(failed))
    sys.exit(1 if failed else 0)
