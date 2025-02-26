import basex from "base-x";
import { exists } from "fs-extra";
import { lstat, readFile } from "fs/promises";
import mimes from "mime-types";
import { err, fromPromise, ok } from "neverthrow";
const base62 = basex("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
export async function parse(absolute, relative) {
    if (!await exists(absolute)) {
        return err("file does not exist");
    }
    if (!(await lstat(absolute)).isFile()) {
        return err("not a file");
    }
    let mime = mimes.lookup(relative);
    if (!mime) {
        mime = mimes.extension('application/octet-stream');
        if (!mime) {
            return err("could not determine mime");
        }
    }
    const stream = await fromPromise(readFile(absolute), err => err);
    if (!stream.isOk()) {
        return err(stream.error);
    }
    const path = relative.replace(/\\/g, "/");
    const name = `f${base62.encode(Buffer.from(absolute))}`;
    const size = stream.value.byteLength;
    const data = [...stream.value].map(b => `0x${b.toString(16)}`).join(", ");
    return ok({ path, mime, name, data, size });
}
