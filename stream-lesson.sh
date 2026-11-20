#!/bin/bash
# Sandip Sir Live Classes - Hindi lesson stream (phone / Termux)
# Lesson video download karke, loop par YouTube par stream karta hai.
echo "Lesson video download ho rahi hai, 1 minute rukho..."
curl -s -o lesson.mp4 https://sandipk.qd.je/hindi-lesson-1.mp4
echo "Ho gayi. Ab stream key paste karo aur Enter dabao:"
read KEY
ffmpeg -re -stream_loop -1 -i lesson.mp4 -c copy -f flv "rtmp://a.rtmp.youtube.com/live2/$KEY"
