/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';

import { execPty, spawnPty } from './main';

describe('minpty', function () {
	this.timeout(10000);

	(process.platform !== 'win32' ? it : it.skip)('Runs in PTY', async () => {
		const output = await execPty('/bin/sh', ['-c', 'if [ -t 1 ] ; then echo pty; fi']);
		assert.strictEqual(output.trim(), 'pty');
	});

	it('Streams output', end => {
		const child = spawnPty(process.execPath, ['-e', 'console.log("running"); setTimeout(() => console.log("done"), 100);']);
		const expected = 'running\r\ndone\r\n';
		let buf = '';
		let i = 0;
		child.onData(data => {
			buf += data;
			i++;
		});
		child.onExit(({ exitCode, signal }) => {
			try {
				assert.strictEqual(exitCode, 0);
				assert.strictEqual(signal, undefined);
				assert.strictEqual(removeEscapeSequences(buf), expected);
				assert.ok(i > 1);
				end();
			} catch (err) {
				end(err);
			}
		});
	});

	it('Concurrent', async () => {
		function runPty(i: number) {
			return new Promise<void>((res, rej) => {
				const child = spawnPty(process.execPath, ['-e', `console.log("running${i}"); setTimeout(() => console.log("done${i}"), 100);`]);
				const expected = `running${i}\r\ndone${i}\r\n`;
				let buf = '';
				child.onData(data => {
					buf += data;
				});
				child.onExit(({ exitCode, signal }) => {
					try {
						assert.strictEqual(exitCode, 0);
						assert.strictEqual(signal, undefined);
						assert.strictEqual(removeEscapeSequences(buf), expected);
						res();
					} catch (err) {
						rej(err);
					}
				});
			});
		}
		await Promise.all([runPty(1), runPty(2), runPty(3)]);
	});
});

const terminalEscapeSequences = /(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]/g; // https://stackoverflow.com/questions/14693701/how-can-i-remove-the-ansi-escape-sequences-from-a-string-in-python/33925425#33925425
const processTitle = /\x1B]0;[^\x07]*\x07/g;

function removeEscapeSequences(buf: string): string {
	return buf.replace(processTitle, '')
		.replace(terminalEscapeSequences, '');
}
