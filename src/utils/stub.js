import { toB64, toHex } from './xor';

function fmtArr(bytes, chunkSize) {
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push('    ' + Array.from(bytes.slice(i, i + chunkSize)).join(','));
  }
  return chunks.join(',\n');
}

export function renderStubCode({ blob, keyRaw, blobFmt }, stubStyle) {
  const rawBytes  = Array.from(blob);
  const b64str    = toB64(blob);
  const hexStr    = rawBytes.map(x => x.toString(16).padStart(2, '0')).join('');
  const chunkedRaw = fmtArr(blob, 16);

  const isSingleByte = keyRaw.length === 1;
  const keyHexLit    = '0x' + keyRaw[0].toString(16).toUpperCase().padStart(2, '0');
  const keyArrChunk  = fmtArr(keyRaw, 16);

  function keyDecl(style) {
    if (isSingleByte) return '    var key = ' + keyHexLit + ';';
    if (style === 'node') return '    var key = Buffer.from([\n' + keyArrChunk + '\n    ]);';
    return '    var key = [\n' + keyArrChunk + '\n    ];';
  }

  // Fixed: was 'enc[i]' in the original Node.js branch — 'encoded' is the correct variable name
  const xorExpr = isSingleByte
    ? 'encoded[i] ^ key'
    : 'encoded[i] ^ key[i % key.length]';

  function blobDecl(style) {
    if (blobFmt === 'raw') {
      return '    var encoded = [\n' + chunkedRaw + '\n    ];';
    }
    if (blobFmt === 'hex') {
      if (style === 'node') return '    var encoded = Buffer.from("' + hexStr + '", "hex");';
      if (style === 'wscript') {
        return (
          '    var _hs = "' + hexStr + '";\n' +
          '    var encoded = [];\n' +
          '    for (var _i = 0; _i < _hs.length; _i += 2) { encoded.push(parseInt(_hs.substr(_i, 2), 16)); }'
        );
      }
      return (
        '    var _hs = "' + hexStr + '";\n' +
        '    var encoded = new Uint8Array(_hs.match(/.{2}/g).map(function(h) { return parseInt(h, 16); }));'
      );
    }
    // base64
    if (style === 'node') return '    var encoded = Buffer.from("' + b64str + '", "base64");';
    if (style === 'wscript') {
      return (
        '    /* Base64 decode (WScript has no atob) */\n' +
        '    var _b = "' + b64str + '", _m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", encoded = [];\n' +
        '    for (var _i = 0; _i < _b.length; _i += 4) {\n' +
        '      var _a=_m.indexOf(_b[_i]),_c=_m.indexOf(_b[_i+1]),_d=_m.indexOf(_b[_i+2]),_e=_m.indexOf(_b[_i+3]);\n' +
        '      encoded.push((_a<<2)|(_c>>4)); if(_d!==-1)encoded.push(((_c&15)<<4)|(_d>>2)); if(_e!==-1)encoded.push(((_d&3)<<6)|_e);\n' +
        '    }'
      );
    }
    return (
      '    var _b64 = "' + b64str + '";\n' +
      '    var _bin = atob(_b64);\n' +
      '    var encoded = new Uint8Array(_bin.length);\n' +
      '    for (var _i = 0; _i < _bin.length; _i++) { encoded[_i] = _bin.charCodeAt(_i); }'
    );
  }

  const fmtComment = blobFmt === 'base64' ? 'Base64' : blobFmt === 'hex' ? 'Hex' : 'raw byte array';

  if (stubStyle === 'browser') {
    return `(function() {
  try {
    /* blob format: ${fmtComment} */
${blobDecl('browser')}
${keyDecl('browser')}
    var decoded = "";
    for (var i = 0; i < encoded.length; i++) {
      decoded += String.fromCharCode(${xorExpr});
    }
    new Function(decoded)();
  } catch(e) {
    console.error("Error: " + e.message);
  }
})();`;
  }

  if (stubStyle === 'node') {
    return `(function() {
  try {
    /* blob format: ${fmtComment} */
${blobDecl('node')}
${keyDecl('node')}
    var decoded = "";
    for (var i = 0; i < encoded.length; i++) {
      decoded += String.fromCharCode(${xorExpr});
    }
    eval(decoded);
  } catch(e) {
    console.error("Error: " + e.message);
  }
})();`;
  }

  if (stubStyle === 'wscript') {
    // NOTE: WScript uses JScript (ES3/ES5). No let/const, no arrow functions, no Promise,
    // no async/await, no template literals. Use only var, function(){}, string concat.
    // XHR must be synchronous: xhr.open("GET", url, false) — callbacks never fire (no event loop).
    // Use ActiveXObject("MSXML2.XMLHTTP"), not new XMLHttpRequest().
    // Run with: cscript.exe script.js   (shows errors in console)
    // Debug:    set debugDecode=true below to inspect the decoded string before eval.
    return `(function() {
  var debugDecode = false; /* set true to print decoded payload instead of running it */
  try {
    /* blob format: ${fmtComment} */
${blobDecl('wscript')}
${keyDecl('wscript')}
    var decoded = "";
    for (var i = 0; i < encoded.length; i++) {
      decoded += String.fromCharCode(${xorExpr});
    }
    if (debugDecode) {
      WScript.Echo(decoded.substring(0, 500));
    } else {
      /* new Function avoids eval() closure-scope issues */
      (new Function(decoded))();
    }
  } catch(e) {
    /* Run with cscript.exe to see this in the terminal */
    try { WScript.StdErr.WriteLine("XOR stub error: " + e.message); } catch(_) {}
    WScript.Echo("XOR stub error: " + e.message);
  }
})();`;
  }

  return '';
}
