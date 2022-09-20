/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EventEmitter } from 'events';
const minpty = require('./lib.node');

export function execPty(cmd: string, args: string[]) {
	return new Promise<string>((res, _rej) => {
		let buf = '';
		minpty.spawn(cmd, args, (s: string) => { buf += s; }, (_err?: any, _res?: PtyExit) => res(buf));
	});
}

export interface Pty {
	onData: Event<string>;
	onExit: Event<PtyExit>;
}

export interface PtyExit {
	exitCode?: number;
	signal?: string;
}

export function spawnPty(cmd: string, args: string[]): Pty {
	const onDataEmitter = new NodeEventEmitter<string>();
	const onExitEmitter = new NodeEventEmitter<PtyExit>();
	minpty.spawn(cmd, args, (s: string) => {
		try {
			onDataEmitter.fire(s);
		} catch (err) {
			console.log(err);
		}
	}, (_err?: any, res?: PtyExit) => {
		try {
			onExitEmitter.fire(res!);
		} catch (err) {
			console.log(err);
		}
	});
	return {
		onData: onDataEmitter.event,
		onExit: onExitEmitter.event,
	}
}

export interface Event<T> {
	(listener: (e: T) => void): Disposable;
}

class NodeEventEmitter<T> {

	private nodeEmitter = new EventEmitter();

	constructor(private register?: { on: () => void; off: () => void }) { }
	event: Event<T> = (listener: (e: T) => void): Disposable => {
		this.nodeEmitter.on('event', listener);
		if (this.register && this.nodeEmitter.listenerCount('event') === 1) {
			this.register.on();
		}
		return {
			dispose: () => {
				if (this.register && this.nodeEmitter.listenerCount('event') === 1) {
					this.register.off();
				}
				this.nodeEmitter.off('event', listener);
			}
		};
	};

	fire(data: T) {
		this.nodeEmitter.emit('event', data);
	}
	dispose() {
		this.nodeEmitter.removeAllListeners();
	}
}

export interface Disposable {
	dispose(): void;
}
