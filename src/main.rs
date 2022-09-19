extern crate libc;
extern crate pty;

use std::env;
use std::io::Read;
use std::process::Command;

use pty::fork::*;

fn main() {
	let fork = Fork::from_ptmx().unwrap();

	if let Ok(mut parent) = fork.is_parent() {
		let mut output = String::new();

		match parent.read_to_string(&mut output) {
			Ok(_nread) => {
				print!("{}", output);
			},
			Err(e) => panic!("read error: {}", e),
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
