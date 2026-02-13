-- CreateTable
CREATE TABLE "swap_transactions" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "from_token" TEXT NOT NULL,
    "to_token" TEXT NOT NULL,
    "from_symbol" TEXT NOT NULL,
    "to_symbol" TEXT NOT NULL,
    "from_amount" TEXT NOT NULL,
    "to_amount" TEXT NOT NULL,
    "tx_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "network" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swap_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "swap_transactions_tx_hash_key" ON "swap_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "swap_transactions_wallet_address_idx" ON "swap_transactions"("wallet_address");

-- CreateIndex
CREATE INDEX "swap_transactions_wallet_address_created_at_idx" ON "swap_transactions"("wallet_address", "created_at" DESC);
