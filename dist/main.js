"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnPty = exports.execPty = void 0;
const events_1 = require("events");
const minpty = __importStar(require("../index"));
function execPty(cmd, args) {
    return new Promise((res, _rej) => {
        let buf = '';
        minpty.spawn(cmd, args, (s) => { buf += s; }, (_err, _res) => res(buf));
    });
}
exports.execPty = execPty;
function spawnPty(cmd, args) {
    const onDataEmitter = new NodeEventEmitter();
    const onExitEmitter = new NodeEventEmitter();
    minpty.spawn(cmd, args, (s) => {
        try {
            onDataEmitter.fire(s);
        }
        catch (err) {
            console.log(err);
        }
    }, (_err, _res) => {
        try {
            onExitEmitter.fire({ exitCode: 0 });
        }
        catch (err) {
            console.log(err);
        }
    });
    return {
        onData: onDataEmitter.event,
        onExit: onExitEmitter.event,
    };
}
exports.spawnPty = spawnPty;
class NodeEventEmitter {
    constructor(register) {
        this.register = register;
        this.nodeEmitter = new events_1.EventEmitter();
        this.event = (listener) => {
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
    }
    fire(data) {
        this.nodeEmitter.emit('event', data);
    }
    dispose() {
        this.nodeEmitter.removeAllListeners();
    }
}
//# sourceMappingURL=main.js.map