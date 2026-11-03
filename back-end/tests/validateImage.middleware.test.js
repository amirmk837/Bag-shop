import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateUploadedImages } from "../src/middlewares/validateImage.middleware.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("accepts a PNG when file signature, MIME type, and extension match", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "bag-upload-"));
  const filePath = path.join(directory, "logo.png");
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await writeFile(filePath, pngHeader);

  const req = {
    file: {
      path: filePath,
      originalname: "logo.png",
      mimetype: "image/png",
    },
  };
  const res = createResponse();
  let nextCalled = false;

  try {
    await validateUploadedImages(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(await readFile(filePath), pngHeader);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects a fake PNG and removes the rejected upload", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "bag-upload-"));
  const filePath = path.join(directory, "fake.png");
  await writeFile(filePath, Buffer.from("<script>alert(1)</script>"));

  const req = {
    file: {
      path: filePath,
      originalname: "fake.png",
      mimetype: "image/png",
    },
  };
  const res = createResponse();
  let nextCalled = false;

  try {
    await validateUploadedImages(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    await assert.rejects(readFile(filePath), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
