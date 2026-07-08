-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "autoUpdateProductTitle" BOOLEAN NOT NULL DEFAULT true,
    "autoUpdateCollectionTitle" BOOLEAN NOT NULL DEFAULT true,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "brandVoice" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_AppSettings" ("autoUpdateCollectionTitle", "autoUpdateProductTitle", "defaultLanguage", "id", "shop") SELECT "autoUpdateCollectionTitle", "autoUpdateProductTitle", "defaultLanguage", "id", "shop" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
