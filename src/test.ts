/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from "assert";
import { execPty } from "./main";

describe('minpty', function () {
	it('ls --color=auto', async () => {
		const output = await execPty('ls', ['--color=auto']);
		assert.ok(output.includes('[0'), 'Output not colored.');
	});
});
