import type { BodyInit } from "bun";
import type { HTTPMethod } from "elysia";
import { env } from "./env";

export type RequestResponse<T> = {
	Status: number,
} & ({
	Ok: true,
	Result: T,
} | {
	Ok: false,
	Result: string,
});

export type Operation<Response> = {
	path: string,
	operationId: string,
} & ({
	done: false,
	response: null,
} | {
	done: true,
	response: Response,
})

export async function makeRequest<T>(url: string, method?: HTTPMethod, body?: BodyInit, contentType?: string): Promise<RequestResponse<T>> {
	if (url.endsWith("/")) throw new Error("Must not have trailing slash...");

	const headers = new Headers()
	headers.append("x-api-key", env.ROBLOX_API_KEY);

	if (contentType) headers.append("content-type", contentType);

	const response = await fetch(url, {
		method: method,
		body: body,
		headers: headers,
	});

	const text = await response.text();

	if (!response.ok) return new Promise(async (resolve) => {
		resolve({Ok: false, Result: text ?? response.statusText, Status: response.status})
	});

	return new Promise(async (resolve) => {
		resolve({Ok: true, Result: JSON.parse(text) as T, Status: response.status})
	});
}

export async function poll<T>(basePath: string, operation: Operation<T>): Promise<RequestResponse<T>> {
	if (!basePath.endsWith("/")) throw new Error("moron");

	const response = await makeRequest<Operation<T>>(basePath + operation.path)
	if (!response.Ok) {
		return new Promise(async (resolve) => {
			resolve(response);
		});
	}

	const result = response.Result
	if (!result.done) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(poll(basePath, operation));
			}, 1000);
		});
	}

	return new Promise(async (resolve) => {
		resolve({Ok: true, Status: response.Status, Result: response.Result.response!});
	});
}

export function createFileForm(data: Uint8Array, fileName: string, mimeType: string): FormData {
	const formData = new FormData();
	const file = new File([data], fileName, { type: mimeType });
	formData.append("fileContent", file);
	return formData
}
