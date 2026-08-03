"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const master_seed_1 = require("../src/prisma/master-seed");
const prisma = new client_1.PrismaClient();
async function main() {
    await (0, master_seed_1.runMasterSeed)(prisma);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
