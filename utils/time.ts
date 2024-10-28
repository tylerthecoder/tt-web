
export async function wait(ms: number) {
	await new Promise<void>(r => {
		setTimeout(() => {
			r()
		}, ms)
	})
}