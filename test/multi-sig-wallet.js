const chai = require("chai")
chai.use(require("chai-as-promised"))

const expect = chai.expect

const MultiSigWallet = artifacts.require("MultiSigWallet");

contract("MultiSigWallet", accounts => {
    // Set up for each test
    const owners = [accounts[0], accounts[1], accounts[2]];
    const NUM_CONFIRMATIONS_REQUIRED = 2;

    let wallet;
    beforeEach(async () => {
        wallet = await MultiSigWallet.new(owners, NUM_CONFIRMATIONS_REQUIRED);
    });

    // test execute TRX function => should succeed/execute
    describe("executeTransaction", () => {
        const to = accounts[3];
        const notOwner = accounts[4];
        const value = 0;
        const data = "0x0";
    
        beforeEach(async () => {
          await wallet.submitTransaction(to, value, data)
          await wallet.confirmTransaction(0, { from: owners[0] })
          await wallet.confirmTransaction(0, { from: owners[1] })
        })
    
        it("should execute a transaction", async () => {
          const { logs } = await wallet.executeTransaction(0)
          console.log(logs)
          assert.equal(logs[0].event, "ExecuteTransaction")
          assert.equal(logs[0].args.owner, owners[0])
          assert.equal(logs[0].args.txIndex, 0)
    
          const tx = await wallet.getTransaction(0)
          assert.equal(tx.executed, true)
        })

        // test execute TRX function => should fail if already executed
        it("should reject transaction if already excuted", async () => {
          await wallet.executeTransaction(0, { from: owners[0] });

          try {
            await wallet.executeTransaction(0, { from: owners[0] })
            throw new Error("tx did not fail")
          } catch (error) {
            assert.equal(error.reason, "tx already executed")
          };
        });

        // test execute TRX function => should fail if already executed - (Using expect)
        it("should reject if already executed", async () => {
          await wallet.executeTransaction(0, {
            from: owners[0],
          })
    
          await expect(
            wallet.executeTransaction(0, {
              from: owners[0],
            })
          ).to.be.rejected
        })

        it("should reject if not the owner", async () => {
          await expect(
            wallet.executeTransaction(0, {
              from : accounts[3],
            })
          ).to.be.rejected
        })
    });
});