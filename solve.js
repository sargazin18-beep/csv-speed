// Dependency-free CSV parser. Slices field spans instead of building strings character by character.
export function run(input) {
  const s = String(input.text), n = s.length, header = input.header === true;
  const rows = [], errors = [];
  let p = s.charCodeAt(0) === 0xfeff ? 1 : 0, line = 1, width = -1, columns = null;
  while (p < n) {
    let c = s.charCodeAt(p);
    if (c === 10) { ++p; ++line; continue; }
    if (c === 13 && s.charCodeAt(p+1) === 10) { p += 2; ++line; continue; }
    const startLine = line, row = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted = false, comma;
    do {
      let value = '', start = p, tail = '', junk = false, added = false;
      quoted = s.charCodeAt(p) === 34;
      if (quoted) {
        const open = p++, oldLine = line;
        let from = p, closed = false;
        while (p < n) {
          c = s.charCodeAt(p);
          if (c === 34) {
            if (s.charCodeAt(p+1) === 34) { value += s.slice(from,p) + '"'; p += 2; from = p; continue; }
            value += s.slice(from,p); ++p; closed = true; break;
          }
          if (c === 13) { value += s.slice(from,p) + '\n'; ++line; p += s.charCodeAt(p+1) === 10 ? 2 : 1; from = p; continue; }
          if (c === 10) ++line;
          ++p;
        }
        if (!closed) { errors.push({code:'unterminated_quote',line:startLine,row}); p = open; line = oldLine; value = ''; }
        else junk = true;
        start = p;
      }
      // Unquoted segment or literal suffix after a closing quote.
      while (p < n) {
        c = s.charCodeAt(p);
        if (c === 44 || c === 10) break;
        if (c === 13) {
          if (s.charCodeAt(p+1) === 10) break;
          if (p > start) { tail += s.slice(start,p); added = true; }
          errors.push({code:'stray_cr',line:startLine,row}); start = ++p; continue;
        }
        ++p;
      }
      if (p > start) { tail += s.slice(start,p); added = true; }
      if (junk && added) errors.push({code:'quote_junk',line:startLine,row});
      fields.push(value + tail);
      comma = p < n && c === 44;
      if (comma) ++p;
      else if (p < n) { p += c === 13 ? 2 : 1; ++line; }
    } while (comma);
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) { columns = fields; continue; }
    if (fields.length < width) { errors.push({code:'short_row',line:startLine,row,fields:fields.length}); while(fields.length < width) fields.push(''); }
    else if (fields.length > width) errors.push({code:'long_row',line:startLine,row,extra:fields.splice(width)});
    rows.push(fields);
  }
  return {columns:header ? columns ?? [] : null,rows,errors};
}
