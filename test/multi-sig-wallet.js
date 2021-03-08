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

  // Testing Constructor Function
  /*
  describe("constructor", () => {
    it("should deploy a contract", async () => { 
 
      for (let i = 0; i < owners.length; i++) {
        assert.equal(await wallet.owners(i), owners[i])
      }
 
      assert.equal(
        await wallet.numConfirmationsRequired(),
        NUM_CONFIRMATIONS_REQUIRED
      )
    }); 
    
    it("should reject if no owners", async () => {
      await expect(MultiSigWallet.new([], NUM_CONFIRMATIONS_REQUIRED)).to.be
        .rejected
    });
 
    it("should reject if number of confrmations required > owners", async () => {
      await expect(MultiSigWallet.new(owners, owners.length + 1)).to.be.rejected
    });
 
    it("should reject if owners not unique", async () => {
      await expect(
        MultiSigWallet.new([owners[0], owners[0]], NUM_CONFIRMATIONS_REQUIRED)
      ).to.be.rejected
    });
  });
  */

  // Testing Fallback Function
  /*
  describe("fallback", async () => {
    it("should receive ether", async () => {
      const { logs } = await wallet.sendTransaction({
        from: accounts[0],
        value: 1,
      })

      assert.equal(logs[0].event, "Deposit")
      assert.equal(logs[0].args.sender, accounts[0])
      assert.equal(logs[0].args.amount, 1)
      assert.equal(logs[0].args.balance, 1)
    })
  })
  */

  // Testing Contructor Function
  /*
    // Testing execute Trx Function
  describe("executeTransaction", () => {
      const to = accounts[3];
      const value = 0;
      const data = "0x0";
  
      beforeEach(async () => {
        await wallet.submitTransaction(to, value, data)
        await wallet.confirmTransaction(0, { from: owners[0] })
        await wallet.confirmTransaction(0, { from: owners[1] })
      });
  
      it("should execute a transaction", async () => {
        // console.log(logs)
        const { logs } = await wallet.executeTransaction(0)
        assert.equal(logs[0].event, "ExecuteTransaction")
        assert.equal(logs[0].args.owner, owners[0])
        assert.equal(logs[0].args.txIndex, 0)
  
        const tx = await wallet.getTransaction(0)
        assert.equal(tx.executed, true)
      });
 
      it("should execute a transaction, (expect)", async () => {
        const { logs } = await wallet.executeTransaction(0)
        expect(logs[0].event).to.equal("ExecuteTransaction");
        expect(logs[0].args.owner).to.equal(owners[0]);
        
  
        const tx = await wallet.getTransaction(0)
        expect(tx.executed).to.equal(true);
      });

      it("should reject transaction if already excuted", async () => {
        await wallet.executeTransaction(0, { from: owners[0] });
        try {
          await wallet.executeTransaction(0, { from: owners[0] })
          throw new Error("tx did not fail")
        } catch (error) {
          assert.equal(error.reason, "tx already executed")
        };
      });

      it("should reject if already executed", async () => {
        await wallet.executeTransaction(0, {
          from: owners[0],
        })
  
        await expect(
          wallet.executeTransaction(0, {
            from: owners[0],
          })
        ).to.be.rejected
      });

      it("should reject if not the owner", async () => {
        await expect(
          wallet.executeTransaction(0, {
            from : accounts[3],
          })
        ).to.be.rejected
      }); 

      it("should reject if trx does not exist", async () => {
        await expect(
          wallet.executeTransaction(1, {
            from : owners[0],
          })
        ).to.be.rejected
      });

  });
  
  */
});