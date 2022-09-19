/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as path from 'path';

export function execPty(cmd: string, args: string[]) {
	return new Promise<string>((res, rej) => {
		cp.execFile(path.join(__dirname, '..', 'target', 'release', 'minpty'), [ cmd, ...args ], (err, stdout, stderr) => {
			if (err) {
				rej(err);
			} else {
				res(stdout + stderr);
			}
		});
	});
}
