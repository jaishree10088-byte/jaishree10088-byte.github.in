#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  Free 24/7 YouTube Live Stream - Android (Termux) version
#  Loops your video to YouTube forever. Auto-restarts if it drops.
#  Your phone stays on anyway - so the stream keeps running
#  even when your PC is OFF.
#  Use this one when your video is already H.264 + AAC
#  (your Hasgulla films are). For any other video, use
#  stream-247-720p.sh instead.
# ============================================================

VIDEO="$HOME/storage/shared/247-stream/one-week.mp4"
STREAM_KEY="PASTE_YOUR_STREAM_KEY_HERE"

if [ "$STREAM_KEY" = "PASTE_YOUR_STREAM_KEY_HERE" ]; then
  echo "Paste your YouTube stream key in this file first (STREAM_KEY line)."
  exit 1
fi
if [ ! -f "$VIDEO" ]; then
  echo "Video not found: $VIDEO"
  echo "Put your video in the phone folder 247-stream/ and fix the VIDEO line."
  exit 1
fi
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found. Run: pkg install ffmpeg"; exit 1; }

termux-wake-lock 2>/dev/null
echo "Starting 24/7 stream: $VIDEO"
echo "Keep Termux running. Stop with Ctrl+C (Volume Down + C)."
while true; do
  echo "[$(date)] starting ffmpeg..."
  ffmpeg -hide_banner -loglevel error -re -stream_loop -1 -i "$VIDEO" -c copy -f flv "rtmp://a.rtmp.youtube.com/live2/$STREAM_KEY"
  echo "[$(date)] ffmpeg stopped. Restarting in 5s..."
  sleep 5
done
