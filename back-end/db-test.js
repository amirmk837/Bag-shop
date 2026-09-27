import {
  createTestProduct,
  getTestProducts,
} from "./src/services/database.service.js";

const run = async () => {
  try {
    const createdProduct = await createTestProduct();

    console.log("Created product:");
    console.log(createdProduct);

    const products = await getTestProducts();

    console.log("All products:");
    console.log(products);
  } catch (error) {
    console.error("Database error:", error);
  }
};

run();
