const { ethers } = require("hardhat");
require("dotenv").config();

const contractAddress = process.env.KOOSH_COIN;
const amountStr = process.env.AMOUNT;
let recipient = process.env.RECIPIENT || null;


async function main() {


	// Resolve amount: allow plain integer (assumed decimals 18) or decimal with dot
	// We'll use ERC20 decimals() to convert if available.
	const [deployer] = await ethers.getSigners();
	console.log(`Using signer: ${deployer.address}`);

	const Koosh = await ethers.getContractFactory("KooshCoin");
	const token = Koosh.attach(contractAddress);

	// Roles are bytes32; MINTER_ROLE in contract is keccak256("MINTER_ROLE")
		const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
	
		// Check if signer has minter role
	const has = await token.hasRole(MINTER_ROLE, deployer.address);
	console.log(`Signer has MINTER_ROLE: ${has}`);

	if (!has) {
		console.error("Signer does not have MINTER_ROLE. Cannot mint.");
		process.exit(2);
	}

	// Determine decimals and parse amount
	let decimals = 18;
	try {
		decimals = await token.decimals();
	} catch (e) {
		// token might not implement decimals()—fall back to 18
	}

	// Accept amounts like '1000' or '1.5'
	const amount = ethers.parseUnits(amountStr, decimals);

	// Default recipient to caller if not provided
	if (!recipient) {
		recipient = deployer.address;
		console.log(`No recipient provided — defaulting to caller: ${recipient}`);
	}

	console.log(`Minting ${amountStr} (raw: ${amount.toString()}) to ${recipient}...`);
	const tx = await token.mint(recipient, amount);
	console.log(`Transaction sent: ${tx.hash}`);
	const receipt = await tx.wait();
	console.log(`Mint successful in tx ${receipt.hash}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
