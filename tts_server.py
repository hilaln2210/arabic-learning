#!/usr/bin/env python3
"""
Tiny TTS server using Microsoft Edge Neural voices.
Run: python3 tts_server.py
Serves on http://localhost:5050/tts?text=مرحبا&slow=0
"""
import asyncio
import io
import edge_tts
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import threading

VOICE_NORMAL = "ar-SA-ZariyahNeural"   # Female, Saudi Arabic neural
VOICE_SLOW   = "ar-SA-ZariyahNeural"

def run_tts(text, slow=False):
    """Synchronously run edge-tts and return MP3 bytes."""
    rate = "-30%" if slow else "+0%"
    buf = io.BytesIO()

    async def _gen():
        communicate = edge_tts.Communicate(text, VOICE_NORMAL, rate=rate)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])

    loop = asyncio.new_event_loop()
    loop.run_until_complete(_gen())
    loop.close()
    return buf.getvalue()

class TTSHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/tts":
            self.send_response(404)
            self.end_headers()
            return

        params = parse_qs(parsed.query)
        text = params.get("text", [""])[0]
        slow = params.get("slow", ["0"])[0] == "1"

        if not text:
            self.send_response(400)
            self.end_headers()
            return

        try:
            audio = run_tts(text, slow)
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(audio)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, max-age=86400")
            self.end_headers()
            self.wfile.write(audio)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def log_message(self, format, *args):
        pass  # Suppress request logs

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 5050), TTSHandler)
    print("TTS server running on http://localhost:5050")
    server.serve_forever()
