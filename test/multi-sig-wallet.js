const MultiSigWallet = artifacts.require("MultiSigWallet");

const chai = require("./setupchai")
const expect = chai.expect
const BN = web3.utils.BN;

chai.use(require("chai-as-promised"))

contract("MultiSigWallet", accounts => {
  // Set up for each test
  const owners = [accounts[0], accounts[1], accounts[2]];
  const NUM_CONFIRMATIONS_REQUIRED = 2;

  let wallet;
  beforeEach(async () => {
      wallet = await MultiSigWallet.new(owners, NUM_CONFIRMATIONS_REQUIRED);
  });

  // // Testing Constructor Function, Setup Tests
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

  // // Testing Fallback Function
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
    });
  });

  // CREATE TRX TESTS
  // Testing Submit Trx function
  describe("submitTransaction", () => {
    const to = accounts[3];
    const value = 0;
    const data = "0x0123";

    it("should submit transaction", async () => {
      const { logs } = await wallet.submitTransaction(to, value, data, {
        from: owners[0],
      })

      assert.equal(logs[0].event, "SubmitTransaction")
      assert.equal(logs[0].args.owner, owners[0])
      assert.equal(logs[0].args.txIndex, 0)
      assert.equal(logs[0].args.to, to)
      assert.equal(logs[0].args.value, value)
      assert.equal(logs[0].args.data, data)

      assert.equal(await wallet.getTransactionCount(), 1)

      const tx = await wallet.getTransaction(0)
      assert.equal(tx.to, to)
      assert.equal(tx.value, value)
      assert.equal(tx.data, data)
      assert.equal(tx.numConfirmations, 0)
      assert.equal(tx.executed, false)
    });

    it("should reject if not owner", async () => {
      await expect(
        wallet.submitTransaction(to, value, data, {
          from: accounts[3],
        })
      ).to.be.rejected
    });
  });
  
  
  // READ TRX TESTS
  // Testing getOwners Function
  describe("getOwners", () => {
    it("should return owners", async () => {
      const res = await wallet.getOwners();

      for (let i = 0; i < res.length; i++) {
        assert.equal(res[i], owners[i])
      }
    });
  });

  // Testing getTrxCount Function
  describe("getTransactionCount", () => {
    it("should return tx count", async () => {
      assert.equal(await wallet.getTransactionCount(), 0)
    });
  });

//***  // Testing getBalance Funtion
  describe("getBalance", () => {
    // const to = accounts[3];
    // const value = 0;
    it("should be able to receive Eth", async () => {
      const expectedContractBal = web3.utils.toBN(10);
      const startContractBal = web3.utils.toBN(0);
      const { logs } = await wallet.send(10, {from: accounts[0]});
      // console.log(logs[0]);


      expect(logs[0].args.balance).to.exist;
      expect(logs[0].args.balance).to.eql(expectedContractBal);
    });
  });
  

  // UPDATE TRX TESTS
  
  // // Testing Confirm Trx Function
  describe("confirmTransaction", () => {
    beforeEach(async () => {
      const to = accounts[3];
      const value = 0;
      const data = "0x0123";

      await wallet.submitTransaction(to, value, data)
    });

    it("should confirm", async () => {
      const { logs } = await wallet.confirmTransaction(0, {
        from: owners[0],
      })

      assert.equal(logs[0].event, "ConfirmTransaction")
      assert.equal(logs[0].args.owner, owners[0])
      assert.equal(logs[0].args.txIndex, 0)

      const tx = await wallet.getTransaction(0)
      assert.equal(tx.numConfirmations, 1)
    });

    it("should reject if not owner", async () => {
      await expect(
        wallet.confirmTransaction(0, {
          from: accounts[3],
        })
      ).to.be.rejected
    });

    it("should reject if tx does not exist", async () => {
      await expect(
        wallet.confirmTransaction(1, {
          from: owners[0],
        })
      ).to.be.rejected
    });

    it("should reject if already confirmed", async () => {
      await wallet.confirmTransaction(0, {
        from: owners[0],
      })

      await expect(
        wallet.confirmTransaction(0, {
          from: owners[0],
        })
      ).to.be.rejected
    });
  });
  
  // // Testing execute Trx Function
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
  
  // // Testing revokeConfirmation Function 
  describe("revokeConfirmation", async () => {
    beforeEach(async () => {
      const to = accounts[3]
      const value = 0
      const data = "0x0"

      await wallet.submitTransaction(to, value, data)
      await wallet.confirmTransaction(0, { from: owners[0] })
    })

    it("should revoke confirmation", async () => {
      const { logs } = await wallet.revokeConfirmation(0, {
        from: owners[0],
      })

      assert.equal(logs[0].event, "RevokeConfirmation")
      assert.equal(logs[0].args.owner, owners[0])
      assert.equal(logs[0].args.txIndex, 0)

      assert.equal(await wallet.isConfirmed(0, owners[0]), false)

      const tx = await wallet.getTransaction(0)
      assert.equal(tx.numConfirmations, 0)
    });

    it("should reject if not owner", async () => {
      await expect(
        wallet.revokeConfirmation(0, {
          from: accounts[3],
        })
      ).to.be.rejected
    });

    it("should reject if tx does not exist", async () => {
      await expect(
        wallet.revokeConfirmation(1, {
          from: owners[0],
        })
      ).to.be.rejected
    });
  });
});