"""Offline stub model server for the regression tests.

Returns canned replies (the sample pack's verified extraction, plus
routing/extraction replies for the practice messages) so the whole
system can be tested with no network and no API key. Token usage is
fabricated by the stub and reported exactly as a real API would.
"""
import json

FULL_JSON = '{\n  "messages": [\n    {"n": 1, "sender": "Dean\'s office", "kind": "fact", "note": "Approved 4-hour hackathon for 150 students in teams of 3."},\n    {"n": 2, "sender": "Margalla Event Halls", "kind": "fact", "note": "Venue options: Room D 80 seats, Hall A 200, Hall B 200, Hall C 300; B & C have generator."},\n    {"n": 3, "sender": "Caterer", "kind": "fact", "note": "Standard lunch box Rs 1,000 per head."},\n    {"n": 4, "sender": "Caterer", "kind": "fact", "note": "Standard lunch box Rs 1,200 per head; basic Rs 800; delivery free."},\n    {"n": 5, "sender": "Judging coordinator", "kind": "fact", "note": "20 judges confirmed, Rs 5,000 honorarium, 15 min per team, max 3 teams per judge."},\n    {"n": 6, "sender": "Finance", "kind": "fact", "note": "Prizes Rs 100,000, backup internet Rs 20,000, printing Rs 10,000 already ordered."},\n    {"n": 7, "sender": "Student society", "kind": "request", "note": "Request DJ for closing, quote Rs 50,000."},\n    {"n": 8, "sender": "A judge", "kind": "fact", "note": "Judge may be 10 minutes late on the day."}\n  ],\n  "event": {\n    "students": 150,\n    "team_size": 3,\n    "duration_minutes": 240,\n    "budget_cap": 650000,\n    "staff": 10\n  },\n  "venue_options": [\n    {"name": "Room D", "capacity": 80, "price": 40000, "features": [], "source": 1},\n    {"name": "Hall A", "capacity": 200, "price": 120000, "features": [], "source": 1},\n    {"name": "Hall B", "capacity": 200, "price": 150000, "features": ["standby generator"], "source": 1},\n    {"name": "Hall C", "capacity": 300, "price": 220000, "features": ["standby generator"], "source": 1}\n  ],\n  "food_options": [\n    {"name": "Standard lunch box", "price_per_head": 1000, "source": 1, "date": "20 Oct"},\n    {"name": "Standard lunch box", "price_per_head": 1200, "source": 1, "date": "12 Nov"},\n    {"name": "Basic lunch box", "price_per_head": 800, "source": 1, "date": "12 Nov"}\n  ],\n  "judging": {\n    "judges_confirmed": 20,\n    "honorarium_each": 5000,\n    "minutes_per_team": 15,\n    "max_teams_per_judge": 3\n  },\n  "committed_costs": [\n    {"item": "prizes", "amount": 100000, "source": 1, "date": "10 Nov"},\n    {"item": "backup internet", "amount": 20000, "source": 1, "date": "10 Nov"},\n    {"item": "printing", "amount": 10000, "source": 1, "date": "10 Nov"}\n  ],\n  "schedule_requirements": [\n    {"item": "prayer break", "minutes": 15, "source": 1}\n  ],\n  "other_constraints": [\n    {"text": "Delivery free hai.", "source": 1},\n    {"text": "I may be 10 minutes late on the day.", "source": 1}\n  ]\n}'

def reply_for(prompt):
    if "Margalla" in prompt:
        return FULL_JSON
    if "You route new messages" in prompt:
        if "printing" in prompt.lower():
            return json.dumps({"kind": "fact", "areas": ["budget"], "summary": "Finance: printing bill is Rs 15,000, not Rs 10,000"})
        if "boxes" in prompt.lower():
            return json.dumps({"kind": "fact", "areas": ["food"], "summary": "Caterer: order rounded down to 100 boxes"})
        return json.dumps({"kind": "irrelevant", "areas": [], "summary": "no planning fact"})
    if "printing" in prompt.lower() and "MESSAGE TEXT:" in prompt:
        return json.dumps({"messages": [], "event": {}, "venue_options": [], "food_options": [], "judging": {}, "committed_costs": [{"item": "printing", "amount": 15000, "source": 1, "date": "18 Nov"}], "schedule_requirements": [], "directives": [], "other_constraints": []})
    if "rounded" in prompt.lower() and "MESSAGE TEXT:" in prompt:
        return json.dumps({"messages": [], "event": {}, "venue_options": [], "food_options": [], "judging": {}, "committed_costs": [], "schedule_requirements": [], "directives": [{"area": "food", "action": "set_quantity", "value": 100, "unit": "boxes", "text": "rounded your order down to 100 boxes"}], "other_constraints": []})
    return FULL_JSON

from http.server import BaseHTTPRequestHandler, HTTPServer

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        content = reply_for(body["messages"][0]["content"])
        resp = {"choices": [{"message": {"content": content}}],
                "usage": {"prompt_tokens": 900, "completion_tokens": 400,
                          "total_tokens": 1300}}
        data = json.dumps(resp).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    def log_message(self, *a):
        pass

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 8799), H).serve_forever()
