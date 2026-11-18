"""Run the offline regression suite:  python3 run_tests.py"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.exit(subprocess.run(
    [sys.executable, os.path.join(HERE, "tests", "test_system.py")]).returncode)
