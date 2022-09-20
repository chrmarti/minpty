/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as path from 'path';

const minptyPath = path.join(__dirname, '..', 'target', 'release', 'minpty');

export function execPty(cmd: string, args: string[]) {
	return new Promise<string>((res, rej) => {
		cp.execFile(minptyPath, [ cmd, ...args ], (err, stdout, stderr) => {
			if (err) {
				rej(err);
			} else {
				res(stdout + stderr);
			}
		});
	});
}

export function spawnPty(cmd: string, args: string[]) {
	return cp.spawn(minptyPath, [ cmd, ...args ]);
}
