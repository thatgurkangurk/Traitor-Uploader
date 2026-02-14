import { bearer as bearerAuth } from "@elysiajs/bearer";
import staticPlugin from "@elysiajs/static";
import Elysia, { status, t } from "elysia";
import { env } from "../env";
import { doesKeyExist, saveKey } from "../Data/db";
import { generate } from "../Data/key";

const PORT = 443;

const app = new Elysia()
	.use(
		await staticPlugin({
			assets: "./Source/Web/Client",
			prefix: "/",
		})
	)
	.use(bearerAuth())
	.post("/key", async ({ bearer }) => {
		if (!bearer) return status(401);
		if (bearer !== env.WEB_PASSWORD) return status(403);

		const key = generate();
		await saveKey(key, [], []);

		return status(200, key);
	})
	.patch("/key", async ({ bearer, body }) => {
		if (!bearer) return status(401);
		if (bearer !== env.WEB_PASSWORD) return status(403);

		if (!await doesKeyExist(body.key)) return status(404);


	}, {
		body: t.Object({
			key: t.String(),
			userIds: t.Optional(t.Array(t.Number())),
			assetIds: t.Optional(t.Array(t.Number())),
		})
	})
	.listen(PORT);

console.log(`Web interface starting at ${app.server?.hostname}:${app.server?.port}`);
