CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "storeName" TEXT NOT NULL DEFAULT 'فروشگاه کاظمی',
    "logoUrl" TEXT,
    "footerLogoUrl" TEXT,
    "phone" TEXT,
    "headerText" TEXT,
    "footerAbout" TEXT,
    "footerCaption" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
