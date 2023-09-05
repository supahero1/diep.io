import sys
import time
import json
import requests
from pathlib import Path

import asyncio
from loguru import logger
from playwright.async_api import BrowserContext as ASyncContext

import hcaptcha_challenger as solver
from hcaptcha_challenger.agents.playwright.tarnished import Malenia
from hcaptcha_challenger.agents.playwright.control import AgentT


tmp_dir = Path(__file__).parent.joinpath("tmp_dir")
user_data_dir = Path(__file__).parent.joinpath("user_data_dir")
captcha_key = None


@logger.catch
async def hit_challenge(context: ASyncContext, times: int = 10):
	page = context.pages[0]
	agent = AgentT.from_page(page=page, tmp_dir=tmp_dir)
	await page.goto("https://accounts.hcaptcha.com/demo?sitekey=fd2d05ad-025b-4382-923e-18e83b9102d4")
	await agent.handle_checkbox()
	for _ in range(1, times):
		result = await agent()
		if result == agent.status.CHALLENGE_BACKCALL:
			await page.wait_for_timeout(500)
			fl = page.frame_locator(agent.HOOK_CHALLENGE)
			await fl.locator("//div[@class='refresh button']").click()
			continue
		if result == agent.status.CHALLENGE_RETRY:
			continue
		if result == agent.status.CHALLENGE_SUCCESS:
			rqdata_path = agent.export_rq()
			with open(rqdata_path, "r") as file:
				global captcha_key
				captcha_key = json.load(file)["generated_pass_UUID"]
			return


async def solve_captcha():
	malenia = Malenia(user_data_dir=user_data_dir)
	await malenia.execute(sequence=[hit_challenge], headless=False)
	return captcha_key


headers = {
	"origin": "https://diep.io",
	"referer": "https://diep.io/",
	"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
}

API_OK = 0
API_PASS = 1
API_KEEP = 2


def join(lobby_id: str) -> int:
	url = "https://matchmaker.api.rivet.gg/v1/lobbies/join"
	data = {
		"lobby_id": lobby_id
	}
	r = requests.post(url, json=data, headers=headers)
	if r.status_code == 403:
		captcha_key = asyncio.run(solve_captcha())
		data["captcha"] = {
			"hcaptcha": {
				"client_response": captcha_key
			}
		}
		r = requests.post(url, json=data, headers=headers)
	body = json.loads(r.text)
	if "code" in body:
		print(body["code"])
		if body["code"] == "MATCHMAKER_LOBBY_FULL":
			return API_KEEP
		if body["code"] == "MATCHMAKER_TOO_MANY_PLAYERS_FROM_SOURCE" or body["code"] == "API_RATE_LIMIT":
			return API_PASS
		raise Exception(f"Unrecognized code {body['code']}")
	send_to_js(body["player"]["token"])
	return API_OK


def send_to_js(msg: str):
	sys.stdout.flush()
	print(">.<")
	print(msg)
	sys.stdout.flush()


if __name__ == "__main__":
	solver.install(upgrade=True, flush_yolo=True)

	lobby_id = sys.stdin.readline().strip()

	i = 0

	while True:
		status = join(lobby_id)
		if status == API_PASS:
			i += 1
		elif status == API_KEEP:
			time.sleep(3)
		time.sleep(2)
