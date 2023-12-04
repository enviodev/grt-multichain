import {
  ERC20Contract_Approval_loader,
  ERC20Contract_Approval_handler,
  ERC20Contract_Transfer_loader,
  ERC20Contract_Transfer_handler,
} from "../generated/src/Handlers.gen";

import { AccountEntity, ApprovalEntity } from "../generated/src/Types.gen";

const polygonAddress = "0x5fe2B58c013d7601147DcdD68C143A77499f5531";
const isPolygon = (srcAddress: string) => {
  return srcAddress == polygonAddress;
};
const ethereumAddress = "0xc944E90C64B2c07662A292be6244BDf05Cda44a7";
const isEthereum = (srcAddress: string) => {
  return srcAddress == ethereumAddress;
};

ERC20Contract_Approval_loader(({ event, context }) => {
  // loading the required Account entity
  context.Account.load(event.params.owner.toString());
});

ERC20Contract_Approval_handler(({ event, context }) => {
  //  getting the owner Account entity
  let ownerAccount = context.Account.get(event.params.owner.toString());

  if (ownerAccount === undefined) {
    // Usually an accoun that is being approved alreay has/has had a balance, but it is possible they havent.

    // create the account
    let accountObject: AccountEntity = {
      id: event.params.owner.toString(),
      balance: 0n,
      balancePolygon: 0n,
      balanceEthereum: 0n,
    };
    context.Account.set(accountObject);
  }

  let approvalId =
    event.params.owner.toString() + "-" + event.params.spender.toString();

  let approvalObject: ApprovalEntity = {
    id: approvalId,
    amount: event.params.value,
    owner: event.params.owner.toString(),
    spender: event.params.spender.toString(),
  };

  // this is the same for create or update as the amount is overwritten
  context.Approval.set(approvalObject);
});

ERC20Contract_Transfer_loader(({ event, context }) => {
  context.Account.load(event.params.from.toString());
  context.Account.load(event.params.to.toString());
});

ERC20Contract_Transfer_handler(({ event, context }) => {
  let senderAccount = context.Account.get(event.params.from.toString());

  if (senderAccount === undefined || senderAccount === null) {
    // create the account
    // This is likely only ever going to be the zero address in the case of the first mint

    let balancePolygon = isPolygon(event.srcAddress)
      ? 0n - event.params.value
      : 0n;
    let balanceEthereum = isEthereum(event.srcAddress)
      ? 0n - event.params.value
      : 0n;

    let accountObject: AccountEntity = {
      id: event.params.from.toString(),
      balance: 0n - event.params.value,
      balancePolygon: balancePolygon,
      balanceEthereum: balanceEthereum,
    };

    context.Account.set(accountObject);
  } else {
    let balancePolygon = isPolygon(event.srcAddress)
      ? senderAccount.balancePolygon - event.params.value
      : senderAccount.balancePolygon;
    let balanceEthereum = isEthereum(event.srcAddress)
      ? senderAccount.balanceEthereum - event.params.value
      : senderAccount.balanceEthereum;

    // subtract the balance from the existing users balance
    let accountObject: AccountEntity = {
      id: senderAccount.id,
      balance: senderAccount.balance - event.params.value,
      balancePolygon: balancePolygon,
      balanceEthereum: balanceEthereum,
    };
    context.Account.set(accountObject);
  }

  let receiverAccount = context.Account.get(event.params.to.toString());

  if (receiverAccount === undefined || receiverAccount === null) {
    // create new account

    let balancePolygon = isPolygon(event.srcAddress) ? event.params.value : 0n;
    let balanceEthereum = isEthereum(event.srcAddress)
      ? event.params.value
      : 0n;

    let accountObject: AccountEntity = {
      id: event.params.to.toString(),
      balance: event.params.value,
      balancePolygon: balancePolygon,
      balanceEthereum: balanceEthereum,
    };
    context.Account.set(accountObject);
  } else {
    // update existing account

    let balancePolygon = isPolygon(event.srcAddress)
      ? receiverAccount.balancePolygon + event.params.value
      : receiverAccount.balancePolygon;
    let balanceEthereum = isEthereum(event.srcAddress)
      ? receiverAccount.balanceEthereum + event.params.value
      : receiverAccount.balanceEthereum;

    let accountObject: AccountEntity = {
      id: receiverAccount.id,
      balance: receiverAccount.balance + event.params.value,
      balancePolygon: balancePolygon,
      balanceEthereum: balanceEthereum,
    };

    context.Account.set(accountObject);
  }
});
