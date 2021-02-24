// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

contract MultiSigWallet {
    // Events
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event EditTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value
    );
    event DeleteTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        bytes data
    );

    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;

    // Struct holding transaction data
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        mapping(address => bool) isConfirmed;
        uint256 numConfirmations;
    }

    // Public array holding ALL transactions
    Transaction[] public transactions;

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(
            !transactions[_txIndex].isConfirmed[msg.sender],
            "tx already confirmed"
        );
        _;
    }

    // setup initial information on contract deployment using contructor
    constructor(address[] memory _owners, uint256 _numConfirmationsRequired)
        public
    {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    // Enable contract to receive money/eth
    // For use outside of remix
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    // For internal remix use
    function deposit() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    // CREATE transaction data
    // Create trx using struct schema, emit as event once created
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    // READ transaction data

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        txExists(_txIndex)
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    function isConfirmed(uint256 _txIndex, address _owner)
        public
        view
        returns (bool)
    {
        Transaction storage transaction = transactions[_txIndex];

        return transaction.isConfirmed[_owner];
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // UPDATE
    // Edit a transaction
    function editTransaction(
        uint256 _txIndex,
        address _to,
        uint256 _value
    )
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        transaction.to = _to;
        transaction.value = _value;

        emit EditTransaction(msg.sender, _txIndex, _to, _value);
    }

    // Cofirm with 2 or all owners, emit event on confirmation
    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        address invalidAddress = 0x0000000000000000000000000000000000000000;

        require(transactions[_txIndex].to != invalidAddress, "Invalid address");

        Transaction storage transaction = transactions[_txIndex];

        transaction.isConfirmed[msg.sender] = true;
        transaction.numConfirmations += 1;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    // Execute if min confirmations met and emit event
    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) =
            transaction.to.call{value: transaction.value}(transaction.data);

        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    // remove confirmations
    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(transaction.isConfirmed[msg.sender], "tx not confirmed");

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations -= 1;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    // DELETE
    function deleteTransaction(uint256 _txIndex, bytes memory _data)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        delete transactions[_txIndex];

        emit DeleteTransaction(msg.sender, _txIndex, _data);
    }
}
