use std::io::Read;
use std::str;

use portable_pty::{CommandBuilder, PtySize, NativePtySystem, PtySystem};

use napi::{
	bindgen_prelude::*,
	threadsafe_function::{ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode, ThreadSafeCallContext},
};
use napi_derive::napi;

// node -p 'const minpty = require("./dist/lib.node"); const child = minpty.spawn("bash", ["-c", "ls --color=auto ; sleep 1s ; ls --color=auto"], s => console.log(">> " + s), res => console.log(res)); console.log("waiting...");'

#[napi]
pub fn spawn(cmd: String, args: Vec<String>, on_data_cb: JsFunction, on_exit_cb: JsFunction) -> Result<()> {
	let on_data_cb: ThreadsafeFunction<String, ErrorStrategy::Fatal> = on_data_cb
	.create_threadsafe_function(0, |ctx: ThreadSafeCallContext<String>| {
		ctx.env.create_string(ctx.value.as_str()).map(|v| vec![v])
	})?;
	let on_exit_cb: ThreadsafeFunction<u32, ErrorStrategy::Fatal> = on_exit_cb
	.create_threadsafe_function(0, |ctx| {
		ctx.env.create_uint32(ctx.value).map(|v| vec![v])
	})?;
	
	run_pty(cmd, args, on_data_cb, on_exit_cb).unwrap();
	
	Ok(())
}

fn run_pty(cmd: String, args: Vec<String>, on_data_cb: ThreadsafeFunction<String, ErrorStrategy::Fatal>, on_exit_cb: ThreadsafeFunction<u32, ErrorStrategy::Fatal>) -> std::result::Result<(), anyhow::Error> {
	let pty_system = NativePtySystem::default();
	let pair = pty_system.openpty(PtySize {
		rows: 24,
		cols: 80,
		pixel_height: 0,
		pixel_width: 0,
	})?;
	let mut cmd = CommandBuilder::new(cmd);
	cmd.args(args);
	let mut child = pair.slave.spawn_command(cmd)?;
	drop(pair.slave);
	
	std::thread::spawn(move || {
		const BUFFER_LEN: usize = 512;
		let mut buffer = [0u8; BUFFER_LEN];
		
		{
			// When the writer is dropped, EOF will be sent:
			let mut _writer = pair.master.try_clone_writer().unwrap();
			
			// macOS quirk: wait briefly before dropping writer.
			if cfg!(target_os = "macos") {
				std::thread::sleep(std::time::Duration::from_millis(20));
			}
		}

		let mut reader = pair.master.try_clone_reader().unwrap();

		let join = std::thread::spawn(move || {
			loop {
				let read_count = reader.read(&mut buffer).unwrap();
				if read_count == 0 {
					break;
				}
				let str = str::from_utf8(&buffer[..read_count]).unwrap().to_string();
				on_data_cb.call(str, ThreadsafeFunctionCallMode::Blocking);
			}
		});
		
		child.wait().unwrap();

		// Only after our processes are done:
		drop(pair.master);

		join.join().unwrap();

		on_exit_cb.call(0, ThreadsafeFunctionCallMode::Blocking);
	});
	
	Ok(())
}
