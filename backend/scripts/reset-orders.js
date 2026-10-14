const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting orders data to none...');
  const delPayments = await prisma.payments.deleteMany({});
  const delOrderItems = await prisma.order_items.deleteMany({});
  const delPurchases = await prisma.purchases.deleteMany({});
  const delOrders = await prisma.orders.deleteMany({});

  console.log(`Successfully reset orders data:`);
  console.log(`- Payments deleted: ${delPayments.count}`);
  console.log(`- Order items deleted: ${delOrderItems.count}`);
  console.log(`- Purchases deleted: ${delPurchases.count}`);
  console.log(`- Orders deleted: ${delOrders.count}`);
}

main()
  .catch((err) => {
    console.error('Error during reset:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
