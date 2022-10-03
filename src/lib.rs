extern crate libc;
extern crate pty;

use std::io::Read;
use std::process::Command;
use std::str;

use pty::fork::Fork;

use napi::{
	bindgen_prelude::*,
	threadsafe_function::{ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode, ThreadSafeCallContext},
};
use napi_derive::napi;

// node -p 'const minpty = require("./dist/lib.node"); const child = minpty.spawn("bash", ["-c", "ls --color=auto ; sleep 1s ; ls --color=auto"], s => console.log(">> " + s), res => console.log(res)); console.log("waiting...");'

#[napi]
pub fn spawn(cmd: String, args: Vec<String>, on_data_cb: JsFunction, on_exit_cb: JsFunction) {
	let on_data_cb: ThreadsafeFunction<String, ErrorStrategy::Fatal> = on_data_cb
	.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<String>| {
		ctx.env.create_string(ctx.value.as_str()).map(|v| vec![v])
	}).unwrap();
	let on_exit_cb: ThreadsafeFunction<u32, ErrorStrategy::Fatal> = on_exit_cb
	.create_threadsafe_function(0, |ctx| {
		ctx.env.create_uint32(ctx.value).map(|v| vec![v])
	}).unwrap();
	std::thread::spawn(move || {
		run_pty(cmd, args, on_data_cb, on_exit_cb);
	});
}

fn run_pty(cmd: String, args: Vec<String>, on_data_cb: ThreadsafeFunction<String, ErrorStrategy::Fatal>, on_exit_cb: ThreadsafeFunction<u32, ErrorStrategy::Fatal>) {
	let fork = Fork::from_ptmx().unwrap();
	if let Ok(mut parent) = fork.is_parent() {
		const BUFFER_LEN: usize = 512;
		let mut buffer = [0u8; BUFFER_LEN];
		
		loop {
			let read_count = parent.read(&mut buffer).unwrap();
			if read_count == 0 {
				break;
			}
			let str = str::from_utf8(&buffer[..read_count]).unwrap().to_string();
			let res = on_data_cb.call(str, ThreadsafeFunctionCallMode::Blocking);
			if res != Status::Ok {
				break;
			}
		}
		
		on_exit_cb.call(0, ThreadsafeFunctionCallMode::Blocking);
	} else {
		Command::new(cmd)
		.args(args)
		.status()
		.expect("could not execute tty");
	}
}
