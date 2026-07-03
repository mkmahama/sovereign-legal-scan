import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { deleteOriginalFile, getOriginalFile, saveOriginalFile } from "./originalFileStore";

describe("originalFileStore", () => {
  it("preserves and retrieves the exact uploaded file", async () => {
    const original = new File(["Page one\nExact source text."], "source-statement.txt", {
      type: "text/plain",
    });

    await saveOriginalFile("case-file-test", original);
    const stored = await getOriginalFile("case-file-test");

    expect(stored?.name).toBe("source-statement.txt");
    expect(stored?.mimeType).toBe("text/plain");
    const restoredText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(stored!.blob);
    });
    expect(restoredText).toBe("Page one\nExact source text.");

    await deleteOriginalFile("case-file-test");
    expect(await getOriginalFile("case-file-test")).toBeNull();
  });
});
