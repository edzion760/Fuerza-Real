-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rol" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "claveHash" TEXT,
    "sesionVersion" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entrenadorId" TEXT,
    "datos" JSONB,
    "plan" JSONB,
    "asignada" JSONB,
    "reporte" JSONB,
    "invitacionHash" TEXT,
    "invitacionVence" DATETIME,
    CONSTRAINT "Usuario_entrenadorId_fkey" FOREIGN KEY ("entrenadorId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Suscripcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Suscripcion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_celular_key" ON "Usuario"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_invitacionHash_key" ON "Usuario"("invitacionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripcion_endpoint_key" ON "Suscripcion"("endpoint");

