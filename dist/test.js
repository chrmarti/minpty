"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const main_1 = require("./main");
describe('minpty', function () {
    it('Runs in PTY', async () => {
        const output = await (0, main_1.execPty)('ls', ['--color=auto']);
        assert_1.default.ok(output.includes('[0'), 'Output not colored.');
    });
    it('Streams output', end => {
        const child = (0, main_1.spawnPty)('node', ['-e', 'console.log("running"); setTimeout(() => console.log("done"), 100);']);
        const expected = ['running', 'done'];
        child.onData(data => {
            try {
                assert_1.default.strictEqual(data.toString().trim(), expected.shift());
            }
            catch (err) {
                end(err);
            }
        });
        child.onExit(({ exitCode, signal }) => {
            try {
                assert_1.default.strictEqual(exitCode, 0);
                assert_1.default.strictEqual(signal, undefined);
                assert_1.default.strictEqual(expected.length, 0);
                end();
            }
            catch (err) {
                end(err);
            }
        });
    });
    it('Concurrent', end => {
        const child1 = (0, main_1.spawnPty)('node', ['-e', 'console.log("running1"); setTimeout(() => console.log("done1"), 300);']);
        const child2 = (0, main_1.spawnPty)('node', ['-e', 'setTimeout(() => console.log("running2"), 100); setTimeout(() => console.log("done2"), 200);']);
        const expected = ['running1', 'running2', 'done2', 'done1'];
        child1.onData(data => {
            try {
                assert_1.default.strictEqual(data.toString().trim(), expected.shift());
            }
            catch (err) {
                end(err);
            }
        });
        child1.onExit(({ exitCode, signal }) => {
            try {
                assert_1.default.strictEqual(exitCode, 0);
                assert_1.default.strictEqual(signal, undefined);
                assert_1.default.strictEqual(expected.length, 0);
                end();
            }
            catch (err) {
                end(err);
            }
        });
        child2.onData(data => {
            try {
                assert_1.default.strictEqual(data.toString().trim(), expected.shift());
            }
            catch (err) {
                end(err);
            }
        });
        child2.onExit(({ exitCode, signal }) => {
            try {
                assert_1.default.strictEqual(exitCode, 0);
                assert_1.default.strictEqual(signal, undefined);
                assert_1.default.strictEqual(expected.length, 1);
            }
            catch (err) {
                end(err);
            }
        });
    });
});
//# sourceMappingURL=test.js.map