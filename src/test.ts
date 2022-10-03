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
		child.onData(data => {
			try {
				assert.strictEqual(data.toString().trim(), expected.shift());
			} catch (err) {
				end(err);
			}
		});
		child.onExit(({ exitCode, signal }) => {
			try {
				assert.strictEqual(exitCode, 0);
				assert.strictEqual(signal, undefined);
				assert.strictEqual(expected.length, 0);
				end();
			} catch (err) {
				end(err);
			}
		});
	});

	it('Concurrent', end => {
		const child1 = spawnPty('node', ['-e', 'console.log("running1"); setTimeout(() => console.log("done1"), 300);']);
		const child2 = spawnPty('node', ['-e', 'setTimeout(() => console.log("running2"), 100); setTimeout(() => console.log("done2"), 200);']);
		const expected = ['running1', 'running2', 'done2', 'done1'];
		child1.onData(data => {
			try {
				assert.strictEqual(data.toString().trim(), expected.shift());
			} catch (err) {
				end(err);
			}
		});
		child1.onExit(({ exitCode, signal }) => {
			try {
				assert.strictEqual(exitCode, 0);
				assert.strictEqual(signal, undefined);
				assert.strictEqual(expected.length, 0);
				end();
			} catch (err) {
				end(err);
			}
		});
		child2.onData(data => {
			try {
				assert.strictEqual(data.toString().trim(), expected.shift());
			} catch (err) {
				end(err);
			}
		});
		child2.onExit(({ exitCode, signal }) => {
			try {
				assert.strictEqual(exitCode, 0);
				assert.strictEqual(signal, undefined);
				assert.strictEqual(expected.length, 1);
			} catch (err) {
				end(err);
			}
		});
	});
});
