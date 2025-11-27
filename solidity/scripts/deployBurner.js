const hre = require("hardhat");

async function main() {
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying KooshBurner with account:", deployer.address);

  // Get KooshCoin address from environment or command line
  const kooshCoinAddress = process.env.KOOSHCOIN_ADDRESS;
  
  if (!kooshCoinAddress) {
    throw new Error("KOOSHCOIN_ADDRESS environment variable is required");
  }

  console.log("Using KooshCoin at:", kooshCoinAddress);

  // Deploy KooshBurner
  const KooshBurner = await hre.ethers.getContractFactory("KooshBurner");
  const kooshBurner = await KooshBurner.deploy(kooshCoinAddress, deployer.address);
  await kooshBurner.waitForDeployment();
  const burnerAddress = kooshBurner.target;
  
  console.log("KooshBurner deployed at:", burnerAddress);
  console.log("");
  console.log("Add to your .env file:");
  console.log(`KOOSH_BURNER_ADDRESS=${burnerAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
