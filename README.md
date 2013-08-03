# supervisor

forked from [isaacs/node-supervisor](https://github.com/isaacs/node-supervisor)

i don't think auto restart program when some file change is a good idea in production envirment,  
but i hope the program would auto restart when they crashed. so i first use node-supervisor like this command:

    supervisor -w not-exists-dir -- myapp.js arg1 arg2

and then, i fork this repo...

## Changes:

-   remove \-watch feature, and reduce code size

-   use `supervisor [options] <program> [args ...]` instead of `supervisor [options] -- <program> [args ...]`

## Introduction

A little supervisor script for nodejs. It runs your program, and
watches for code changes, so you can have hot-code reloading-ish
behavior, without worrying about memory leaks and making sure you
clean up all the inter-module references, and without a whole new
`require` system.

    Node Supervisor is used to restart programs when they crash.

    Usage:
      supervisor [options] <program> [args ...]

    Required:
      <program>
        The program to run.

    Options:
      -x|--exec <executable>
        The executable that runs the specified program.
        Default is 'node'

      --debug
        Start node with --debug flag.

      --debug-brk
        Start node with --debug-brk flag.

      -n|--no-restart-on error|exit
        Don't automatically restart the supervised program if it ends.
        Supervisor will wait for a change in the source files.
        If "error", an exit code of 0 will still restart.
        If "exit", no restart regardless of exit code.

      -h|--help|-?
        Display these usage instructions.

      -q|--quiet
        Suppress DEBUG messages

    Examples:
      supervisor myapp.js
      supervisor myapp.coffee
      supervisor server.js -h host -p port

## Install

Get this code, install npm, and then do this:

    npm link

## todo

1. rewrite the code using litcoffee
2. use another name and add to npm repo
3. send email when crashed
4. store the pid in file
