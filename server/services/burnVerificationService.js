/**
 * Background service to verify pending/submitted burn transactions
 * Runs periodically to check transaction status on-chain
 */

const BurnRecord = require("../models/burnRecordModel");
const Payout = require("../models/payoutModel");
const tokenBurnService = require("./tokenBurnService");
const razorpayPayoutService = require("./razorpayPayoutService");

class BurnVerificationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkIntervalMs = 30000; // Check every 30 seconds
    this.maxAgeHours = 24; // Only check burns from last 24 hours
  }

  /**
   * Start the background verification loop
   */
  start() {
    if (this.isRunning) {
      console.log("Burn verification service already running");
      return;
    }

    console.log("Starting burn verification service...");
    this.isRunning = true;

    // Run immediately on start
    this.checkPendingBurns().catch(console.error);

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.checkPendingBurns().catch(console.error);
    }, this.checkIntervalMs);

    console.log(`Burn verification service started. Checking every ${this.checkIntervalMs / 1000}s`);
  }

  /**
   * Stop the background verification loop
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Burn verification service stopped");
  }

  /**
   * Check all pending/submitted burns and verify them on-chain
   */
  async checkPendingBurns() {
    if (!tokenBurnService.isInitialized()) {
      return; // Skip if token service not ready
    }

    const cutoffDate = new Date(Date.now() - this.maxAgeHours * 60 * 60 * 1000);

    // Find submitted burns that need verification
    const pendingBurns = await BurnRecord.find({
      status: { $in: ["submitted", "pending"] },
      txHash: { $ne: "pending", $exists: true },
      createdAt: { $gte: cutoffDate },
    }).limit(20); // Process max 20 at a time

    if (pendingBurns.length === 0) {
      return;
    }

    console.log(`Verifying ${pendingBurns.length} pending burn(s)...`);

    for (const burn of pendingBurns) {
      try {
        await this.verifyBurn(burn);
      } catch (error) {
        console.error(`Error verifying burn ${burn._id}:`, error.message);
      }
    }
  }

  /**
   * Verify a single burn transaction
   */
  async verifyBurn(burnRecord) {
    if (!burnRecord.txHash || burnRecord.txHash === "pending") {
      return;
    }

    console.log(`Checking burn ${burnRecord._id}: ${burnRecord.txHash} (current status: ${burnRecord.status})`);

    try {
      // Get transaction receipt
      const receipt = await tokenBurnService.web3.eth.getTransactionReceipt(burnRecord.txHash);

      if (!receipt) {
        // Transaction not yet mined - check if it's been too long
        const ageMs = Date.now() - new Date(burnRecord.createdAt).getTime();
        const ageHours = ageMs / (60 * 60 * 1000);
        
        if (ageHours > 2) {
          // Transaction stuck for over 2 hours - might need manual intervention
          console.log(`Burn ${burnRecord._id} pending for ${ageHours.toFixed(1)} hours`);
        }
        return;
      }

      // Transaction has been mined
      if (receipt.status) {
        // Transaction succeeded - verify it's actually a burn
        const verification = await tokenBurnService.verifyBurn(burnRecord.txHash);
        
        if (verification.verified) {
          // Update using findByIdAndUpdate to ensure it persists
          await BurnRecord.findByIdAndUpdate(burnRecord._id, {
            status: "confirmed",
            blockNumber: verification.blockNumber,
            verifiedAt: new Date(),
            errorMessage: null, // Clear any previous error
          });
          
          // Also update the in-memory object
          burnRecord.status = "confirmed";
          burnRecord.blockNumber = verification.blockNumber;
          burnRecord.verifiedAt = new Date();
          burnRecord.errorMessage = null;
          
          console.log(`✓ Burn ${burnRecord._id} confirmed! Block: ${verification.blockNumber}`);

          // Check if there's an associated payout that needs to be processed
          await this.processPendingPayout(burnRecord);
        } else {
          // Transaction succeeded but not a valid burn
          await BurnRecord.findByIdAndUpdate(burnRecord._id, {
            status: "failed",
            errorMessage: `Transaction succeeded but no valid burn event found: ${verification.reason}`,
          });
          console.log(`✗ Burn ${burnRecord._id} invalid: ${verification.reason}`);
        }
      } else {
        // Transaction failed on-chain
        await BurnRecord.findByIdAndUpdate(burnRecord._id, {
          status: "failed",
          errorMessage: "Transaction reverted on-chain",
        });
        console.log(`✗ Burn ${burnRecord._id} reverted on-chain`);
      }
    } catch (error) {
      console.error(`Error checking burn ${burnRecord._id}:`, error.message);
    }
  }

  /**
   * Process payout for a confirmed burn
   */
  async processPendingPayout(burnRecord) {
    // Check if there's a payout waiting for this burn (pending or previously failed)
    const payout = await Payout.findOne({
      burnRecord: burnRecord._id,
      status: { $in: ["pending", "failed"] },
    });

    if (!payout) {
      return;
    }

    console.log(`Processing payout ${payout._id} for confirmed burn ${burnRecord._id}`);

    // Update payout status to processing
    payout.status = "processing";
    payout.failureReason = null;
    await payout.save();

    // Try to initiate Razorpay payout
    try {
      if (razorpayPayoutService.isInitialized()) {
        await razorpayPayoutService.createPayout(payout);
        console.log(`✓ Payout ${payout._id} initiated via Razorpay`);
      } else {
        // Razorpay not configured - mark as pending manual processing
        payout.status = "pending_manual";
        payout.failureReason = "Razorpay Payouts API not configured. Manual bank transfer required.";
        await payout.save();
        console.log(`Razorpay not initialized, payout ${payout._id} requires manual processing`);
      }
    } catch (error) {
      console.error(`Failed to initiate payout ${payout._id}:`, error.message);
      // Instead of failing, mark as pending_manual so admin can handle it
      payout.status = "pending_manual";
      payout.failureReason = `Auto-payout failed: ${error.message}. Please process manually.`;
      await payout.save();
    }
  }

  /**
   * Manually trigger verification for a specific burn
   */
  async verifyBurnById(burnRecordId) {
    const burn = await BurnRecord.findById(burnRecordId);
    if (!burn) {
      throw new Error("Burn record not found");
    }

    await this.verifyBurn(burn);
    return burn;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      maxAgeHours: this.maxAgeHours,
    };
  }
}

// Export singleton instance
const burnVerificationService = new BurnVerificationService();
module.exports = burnVerificationService;
