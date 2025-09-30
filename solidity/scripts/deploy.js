const hre = require("hardhat");

async function main() {
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy KooshCoin
  const KooshCoin = await hre.ethers.getContractFactory("KooshCoin");
  const kooshCoin = await KooshCoin.deploy(deployer.address);
  await kooshCoin.waitForDeployment();
  const kooshCoinAddress = kooshCoin.target;
  console.log("KooshCoin deployed at:", kooshCoinAddress);

  // 2. Deploy EscrowFactory with KooshCoin address
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy(kooshCoinAddress);
  await escrowFactory.waitForDeployment();
  const escrowFactoryAddress = escrowFactory.target;
  console.log("EscrowFactory deployed at:", escrowFactoryAddress);

  // 3. Grant MINTER_ROLE to EscrowFactory
  const MINTER_ROLE = await kooshCoin.MINTER_ROLE();
  const tx = await kooshCoin.grantRole(MINTER_ROLE, escrowFactoryAddress);
  await tx.wait();
  console.log("MINTER_ROLE granted to EscrowFactory.");

  // 4. Print summary
  console.log("Deployment complete:");
  console.log("KooshCoin:", kooshCoinAddress);
  console.log("EscrowFactory:", escrowFactoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
