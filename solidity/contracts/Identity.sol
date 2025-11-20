// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Identity {
    struct User {
        string name;
        uint256 createdAt;
        string company;
        string email;
        string phone;
        bool exists;
    }

    mapping(address => User) public users;
    mapping(address => bool) public admins;

    event UserCreated(address indexed user, string name, uint256 createdAt);
    event UserUpdated(address indexed user, string name);

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not admin");
        _;
    }

    constructor(address[] memory initialAdmins) {
        for (uint256 i = 0; i < initialAdmins.length; i++) {
            admins[initialAdmins[i]] = true;
        }
    }

    function addAdmin(address admin) external onlyAdmin {
        admins[admin] = true;
    }

    function removeAdmin(address admin) external onlyAdmin {
        admins[admin] = false;
    }

    function createUser(
        address userAddr,
        string calldata name,
        string calldata company,
        string calldata email,
        string calldata phone
    ) external onlyAdmin {
        require(!users[userAddr].exists, "User exists");
        users[userAddr] = User({
            name: name,
            createdAt: block.timestamp,
            company: company,
            email: email,
            phone: phone,
            exists: true
        });
        emit UserCreated(userAddr, name, block.timestamp);
    }

    function updateUser(
        address userAddr,
        string calldata name,
        string calldata company,
        string calldata email,
        string calldata phone
    ) external onlyAdmin {
        require(users[userAddr].exists, "User not found");
        users[userAddr].name = name;
        users[userAddr].company = company;
        users[userAddr].email = email;
        users[userAddr].phone = phone;
        emit UserUpdated(userAddr, name);
    }

    function getUser(address userAddr) external view returns (
        string memory name,
        uint256 createdAt,
        string memory company,
        string memory email,
        string memory phone
    ) {
        require(users[userAddr].exists, "User not found");
        User storage user = users[userAddr];
        return (user.name, user.createdAt, user.company, user.email, user.phone);
    }
}