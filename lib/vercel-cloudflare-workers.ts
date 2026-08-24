const unavailableDatabase = {
  prepare() {
    throw new Error("Cloudflare D1 is available only on the canonical chatonyou.com application");
  },
  batch() {
    throw new Error("Cloudflare D1 is available only on the canonical chatonyou.com application");
  },
};

export const env = {
  DB: unavailableDatabase,
};
