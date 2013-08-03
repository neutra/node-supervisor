var util = require("util");
var fs = require("fs");
var spawn = require("child_process").spawn;
var path = require("path");
var startChildProcess;
var noRestartOn = null;
var debug = true;
var verbose = false;

exports.run = run;

function run (args) {
  var arg, next, watch, program, extensions, executor, debugFlag, debugBrkFlag;
  while (arg = args.shift()) {
    if (arg === "--help" || arg === "-h" || arg === "-?") {
      return help();
    } else if (arg === "--quiet" || arg === "-q") {
      debug = false;
      util.debug = function(){};
      util.puts = function(){};
    } else if (arg === "--verbose" || arg === "-V") {
      verbose = true;
    } else if (arg === "--extensions" || arg === "-e") {
      extensions = args.shift();
    } else if (arg === "--exec" || arg === "-x") {
      executor = args.shift();
    } else if (arg === "--no-restart-on" || arg === "-n") {
      noRestartOn = args.shift();
    } else if (arg === "--debug") {
      debugFlag = true;
    } else if (arg === "--debug-brk") {
      debugBrkFlag = true;
    } else if (arg === "--") {
	  // try compatible with origin node-supervisor
      program = args;
      break;
    } else if (arg.indexOf("-") && !args.length) {
	  // try compatible with origin node-supervisor
      // Assume last arg is the program
      program = [arg];
    } else {
      program = args;
      break;
	}
  }
  if (!program) {
    return help();
  }

  var programExt = program.join(" ").match(/.*\.(\S*)/);
  programExt = programExt && programExt[1];

  if (!executor) {
    executor = (programExt === "coffee" || programExt === "litcoffee") ? "coffee" : "node";
  }

  if (debugFlag) {
    program.unshift("--debug");
	if (executor === "coffee") {
      program.unshift("--nodejs")
	}
  }
  if (debugBrkFlag) {
    program.unshift("--debug-brk");
	if (executor === "coffee") {
      program.unshift("--nodejs")
	}
  }

  // Pass kill signals through to child
  [ "SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT" ].forEach( function(signal) {
	try {
      process.on(signal, function () {
        var child = exports.child;
        if (child) {
          util.debug("Sending " + signal + " to child...");
          child.kill(signal);
        }
        process.exit();
      });
    } catch(e) {
      // Windows doesn't support signals yet, so they simply don't get this handling.
      // https://github.com/joyent/node/issues/1553
    }
  });

  util.puts("")
  util.debug("Running supervisor");
  util.puts("");

  // store the call to startProgramm in startChildProcess in order to call it later
  startChildProcess = function() { 
    startProgram(program, executor); 
  };

  // run it, and restart when it crashes.
  startChildProcess();
};

function print (m, n) { util.print(m+(!n?"\n":"")); return print; }

function help () {
  print
    ("")
    ("Node Supervisor is used to restart programs when they crash.")
    ("")
    ("Usage:")
    ("  supervisor [options] <program> [args ...]")
    ("")
    ("Required:")
    ("  <program>")
    ("    The program to run.")
    ("")
    ("Options:")
    ("  -x|--exec <executable>")
    ("    The executable that runs the specified program.")
    ("    Default is 'node'")
    ("")
    ("  --debug")
    ("    Start node with --debug flag.")
    ("")
    ("  --debug-brk")
    ("    Start node with --debug-brk flag.")
    ("")
    ("  -n|--no-restart-on error|exit")
    ("    Don't automatically restart the supervised program if it ends.")
    ("    If \"error\", an exit code of 0 will still restart.")
    ("    If \"exit\", no restart regardless of exit code.")
    ("")
    ("  -h|--help|-?")
    ("    Display these usage instructions.")
    ("")
    ("  -q|--quiet")
    ("    Suppress DEBUG messages")
    ("")
    ("  -V|--verbose")
    ("    Show extra DEBUG messages")
    ("")
    ("Examples:")
    ("  supervisor myapp.js")
    ("  supervisor myapp.coffee")
    ("  supervisor server.js -h host -p port")
    ("  supervisor -- server.js -h host -p port")
    ("");
};

function startProgram (prog, exec) {
  util.debug("Starting child process with '" + exec + " " + prog.join(" ") + "'");
  var child = exports.child = spawn(exec, prog, {stdio: 'inherit'});
  if (child.stdout) {
    // node < 0.8 doesn't understand the 'inherit' option, so pass through manually
    child.stdout.addListener("data", function (chunk) { chunk && util.print(chunk); });
    child.stderr.addListener("data", function (chunk) { chunk && util.debug(chunk); });
  }
  child.addListener("exit", function (code) {
    util.debug("Program " + exec + " " + prog.join(" ") + " exited with code " + code + "\n");
    exports.child = null;
    if (noRestartOn == "exit" || noRestartOn == "error" && code !== 0) {
	  process.exit();
	  return;
	}
    startProgram(prog, exec);
  });
}