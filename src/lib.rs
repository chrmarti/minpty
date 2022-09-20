extern crate libc;
extern crate pty;

use std::cell::RefCell;
use std::io::Read;
use std::process::Command;
use std::str;

use pty::fork::Fork;

use neon::prelude::*;

type BoxedPtyExec = JsBox<RefCell<PtyExec>>;

struct PtyExec {
}

impl Finalize for PtyExec {}

// node -p 'const minpty = require("./dist/lib.node"); const child = minpty.spawn("bash", ["-c", "ls --color=auto ; sleep 1s ; ls --color=auto"], s => console.log(">> " + s), res => console.log(res)); console.log("waiting...");'

fn spawn(mut cx: FunctionContext) -> JsResult<BoxedPtyExec> {
	let cmd = cx.argument::<JsString>(0)?.value(&mut cx);
	let args = cx.argument::<JsArray>(1)?.to_vec(&mut cx).unwrap()
		.iter()
		.map(|arg| arg.downcast::<JsString, FunctionContext>(&mut cx).unwrap().value(&mut cx))
		.collect::<Vec<String>>();
	let on_data_cb = cx.argument::<JsFunction>(2)?.root(&mut cx);
	let on_exit_cb = cx.argument::<JsFunction>(3)?.root(&mut cx);
	let channel = cx.channel();
	
	std::thread::spawn(move || {
		run_pty(channel, cmd, args, on_data_cb, on_exit_cb);
	});
	
	Ok(cx.boxed(RefCell::new(PtyExec {})))
}

fn run_pty(channel: Channel, cmd: String, args: Vec<String>, mut on_data_cb: Root<JsFunction>, on_exit_cb: Root<JsFunction>) {
	let fork = Fork::from_ptmx().unwrap();
	if let Ok(mut parent) = fork.is_parent() {
		const BUFFER_LEN: usize = 512;
		let mut buffer = [0u8; BUFFER_LEN];
		
		loop {
			let read_count = parent.read(&mut buffer).unwrap();
			if read_count == 0 {
				break;
			}
			on_data_cb = channel.send(move |mut cx| {
				let on_data_cb = on_data_cb.into_inner(&mut cx);
				let str = cx.string(str::from_utf8(&buffer[..read_count]).unwrap());
				on_data_cb.call_with(&cx)
					.arg(str)
					.apply::<JsUndefined, TaskContext>(&mut cx)?;
				
				Ok(on_data_cb.root(&mut cx))
			}).join().unwrap();
		}

		channel.send(move |mut cx| {
			let on_exit_cb = on_exit_cb.into_inner(&mut cx);
			let undefined = cx.undefined();
			let res = cx.empty_object();
			let exit_code = cx.number(0);
			res.set(&mut cx, "exitCode", exit_code).unwrap();
			on_exit_cb.call_with(&cx)
				.arg(undefined)
				.arg(res)
				.apply::<JsUndefined, TaskContext>(&mut cx)?;
			
			Ok(())
		}).join().unwrap();
	} else {
		Command::new(cmd)
			.args(args)
			.status()
			.expect("could not execute tty");
	}
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("spawn", spawn)?;
	Ok(())
}
