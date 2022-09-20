/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { execPty, spawnPty } from './main';

describe('minpty', function () {
	it('Runs in PTY', async () => {
		const output = await execPty('ls', ['--color=auto']);
		assert.ok(output.includes('[0'), 'Output not colored.');
	});

	it('Streams output', end => {
		const child = spawnPty('node', ['-e', 'console.log("running"); setTimeout(() => console.log("done"), 100);']);
		const expected = ['running', 'done'];
		child.stdout.on('data', data => {
			try {
				assert.strictEqual(data.toString().trim(), expected.shift());
			} catch (err) {
				end(err);
			}
		});
		child.on('exit', (code, signal) => {
			try {
				assert.strictEqual(code, 0);
				assert.strictEqual(signal, null);
				assert.strictEqual(expected.length, 0);
				end();
			} catch (err) {
				end(err);
			}
		});
		child.on('error', err => {
			end(err);
		});
	});
});
