/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

extern crate libc;
extern crate pty;

use std::env;
use std::io::{ self, Read, Write };
use std::process::Command;

use pty::fork::*;

fn main() {
	let fork = Fork::from_ptmx().unwrap();

	if let Ok(mut child) = fork.is_parent() {

		const BUFFER_LEN: usize = 512;
		let mut buffer = [0u8; BUFFER_LEN];
	
		loop {
			let read_count = child.read(&mut buffer).unwrap();
			if read_count == 0 {
				break;
			}
			io::stdout().write_all(&buffer[..read_count]).unwrap();
		}
	} else {
		let args: Vec<String> = env::args().collect();
		if args.len() > 1 {
			let program = &args[1];
			let program_args = &args[2..];
			Command::new(program)
				.args(program_args)
				.status()
				.expect("could not execute tty");
		}
	}
}
