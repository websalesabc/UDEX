const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
  let deployer, feeAccount, exchange

  const feePercent = 10

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory('Exchange')
    const Token = await ethers.getContractFactory('Token')

    token1 = await Token.deploy('Dapp University', 'DAPP', '1000000')
    token2 = await Token.deploy('Mock Dai', 'mDAI', '1000000')

    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    user1 = accounts[2]

    let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))

    exchange = await Exchange.deploy(feeAccount.address, feePercent)
  })

  describe('Deployment', () => {

    it('tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it('tracks the fee percent', async () => {
      expect(await exchange.feePercent()).to.equal(feePercent)
    })

  })

  describe ('Depositing tokens', () => {
    let transaction, result
    let amount = tokens(10)



    describe('Success', () => {
      beforeEach(async () => {
        //approve tokens
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()
        //deposit token
        transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        result = await transaction.wait()
      })

      it('tracts the deposit function', async () =>{
        expect(await token1.balanceOf(exchange.address)).to.equal(amount)
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
        expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
      })

      it('emits a Deposit event', async () => {
        const event = result.events[1] // two events are emitted
        expect(event.event).to.equal('Deposit')

        const args = event.args
        expect(args.token).to.equal(token1.address)
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
        expect(args.balance).to.equal(amount)
      })
    })

    describe('Failure', () => {
      it('fails when no tokens are approved', async() => {
        //Dont aprove any Tokens
        await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
      })
    })

  })


  describe ('Withdrawing tokens', () => {
      let transaction, result
      let amount = tokens(10)

      describe('Success', () => {
        beforeEach(async () => {
          //Deposit tokens before withdrawing
          //approve tokens
          transaction = await token1.connect(user1).approve(exchange.address, amount)
          result = await transaction.wait()
          //deposit token
          transaction = await exchange.connect(user1).depositToken(token1.address, amount)
          result = await transaction.wait()

          // Now withdrawing
          transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
          result = await transaction.wait()


        })

        it('withdraws token funds', async () =>{
          expect(await token1.balanceOf(exchange.address)).to.equal(0)
          expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
          expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
        })

        it('emits a Withdrawal event', async () => {
          const event = result.events[1] // two events are emitted
          expect(event.event).to.equal('Withdraw')

          const args = event.args
          expect(args.token).to.equal(token1.address)
          expect(args.user).to.equal(user1.address)
          expect(args.amount).to.equal(amount)
          expect(args.balance).to.equal(0)
        })
      })

      describe('Failure', () => {
         it('fails for insufficient balance', async() => {
          //Atempt to withdraw without depositing
          await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
        })
      })

    })

    describe ('Checking balances', () => {
      let transaction, result
      let amount = tokens(1)

      beforeEach(async () => {
          //approve tokens
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()
          //deposit token
        transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        result = await transaction.wait()
      })

      it('returns user balance', async () =>{
          expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
        })

    })

    describe ('Making orders', async () => {
      let transaction, result

      describe('Success', async () => {
        beforeEach (async () => {
          //Deposit tokens before making order
          //approve tokens
          transaction = await token1.connect(user1).approve(exchange.address, amount)
          result = await transaction.wait()
          //deposit token
          transaction = await exchange.connect(user1).depositToken(token1.address, amount)
          result = await transaction.wait()
          //Make orders
          transaction = await exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))

        })

        it('Tracts the newly created orders', async () => {
          expect(await exchage.orderCount()).to.equal(1)

        })
      })

      describe('Failure', async () => {


    })

})
