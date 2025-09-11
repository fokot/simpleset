// Process polyfill for browser environment
// This provides a minimal process object that ECharts and other Node.js libraries expect

if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = {
    env: {
      NODE_ENV: 'production'
    },
    version: '',
    versions: {
      node: ''
    },
    platform: 'browser',
    nextTick: function(callback) {
      setTimeout(callback, 0);
    },
    cwd: function() {
      return '/';
    },
    chdir: function() {
      // No-op in browser
    },
    umask: function() {
      return 0;
    },
    hrtime: function(previousTimestamp) {
      const now = performance.now();
      const seconds = Math.floor(now / 1000);
      const nanoseconds = Math.floor((now % 1000) * 1000000);
      
      if (previousTimestamp) {
        const [prevSeconds, prevNanoseconds] = previousTimestamp;
        return [
          seconds - prevSeconds,
          nanoseconds - prevNanoseconds
        ];
      }
      
      return [seconds, nanoseconds];
    },
    exit: function() {
      // No-op in browser
    },
    kill: function() {
      // No-op in browser
    },
    pid: 1,
    ppid: 0,
    title: 'browser',
    arch: 'javascript',
    argv: [],
    argv0: 'browser',
    execArgv: [],
    execPath: '',
    abort: function() {
      throw new Error('process.abort() called');
    },
    binding: function() {
      throw new Error('process.binding is not supported in browser');
    },
    stdout: {
      write: function(data) {
        console.log(data);
      }
    },
    stderr: {
      write: function(data) {
        console.error(data);
      }
    },
    stdin: {
      read: function() {
        return null;
      }
    }
  };
}

// Also set on window for compatibility
if (typeof window !== 'undefined' && !window.process) {
  window.process = globalThis.process;
}

export default globalThis.process;
