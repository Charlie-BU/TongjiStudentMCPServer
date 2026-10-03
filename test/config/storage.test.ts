import assert from "node:assert/strict";
import { it } from "node:test";
import { resolve } from "node:path";
import { loadDataDirectory } from "../../src/config/storage";

it("resolves explicit directory, Railway mount, then project default", () => {
    assert.equal(loadDataDirectory({}), resolve(__dirname, "../../data"));
    assert.equal(loadDataDirectory({ MCP_DATA_DIR: "custom-data" }), resolve("custom-data"));
    assert.equal(loadDataDirectory({ RAILWAY_VOLUME_MOUNT_PATH: "/volume" }), "/volume");
    assert.equal(loadDataDirectory({ MCP_DATA_DIR: "", RAILWAY_VOLUME_MOUNT_PATH: "/volume" }), "/volume");
    assert.equal(loadDataDirectory({ MCP_DATA_DIR: "/custom", RAILWAY_VOLUME_MOUNT_PATH: "/volume" }), "/custom");
});

it("Railway requires a volume and rejects paths outside it", () => {
    const environment = { RAILWAY_ENVIRONMENT_ID: "test", RAILWAY_VOLUME_MOUNT_PATH: "/volume" };
    assert.throws(() => loadDataDirectory({ RAILWAY_ENVIRONMENT_ID: "test" }), /requires a persistent volume/);
    assert.equal(loadDataDirectory(environment), "/volume");
    assert.equal(loadDataDirectory({ ...environment, MCP_DATA_DIR: "/volume/mcp" }), "/volume/mcp");
    for (const directory of ["/other", "/volume-other", "/volume/../outside"]) {
        assert.throws(() => loadDataDirectory({ ...environment, MCP_DATA_DIR: directory }), /must be inside/);
    }
});
