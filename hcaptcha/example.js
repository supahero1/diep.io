import { spawn } from "child_process";

const python = spawn("python3", ["diep.py"]);

const lobby_id = "257981ee-fa5f-4a9d-9e83-43bdde70291b";

python.stdout.on("data", function(data) {
	data = data.toString("ascii");
	if(!data.startsWith(">.<\n"))
	{
		return;
	}
	data = data.substring(4).split(">.<\n");
	for(let token of data)
	{
		token = token.trim();
		if(!token.startsWith("player")) continue;
		console.log("token:", token);
	}
});

python.stdin.write(lobby_id + "\n");
