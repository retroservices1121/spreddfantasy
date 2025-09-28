// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SpreadMarkets - Fantasy Prediction Markets Platform
 * @dev Main contract for managing leagues, markets, and portfolios with USDC payments
 */
contract SpreadMarkets is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    
    Counters.Counter private _leagueIds;
    Counters.Counter private _marketIds;
    
    // USDC token contract on Base
    IERC20 public immutable usdcToken;
    
    // Platform settings
    uint256 public platformFeePercentage = 500; // 5% in basis points
    address public feeRecipient;
    
    struct League {
        uint256 id;
        string name;
        string leagueType; // "daily", "weekly", "monthly"
        uint256 entryFee; // Fixed entry fee in USDC (6 decimals)
        uint256 maxParticipants;
        uint256 currentParticipants;
        address creator;
        uint256 endTime;
        bool isActive;
        bool isResolved;
        uint256 totalPrizePool;
    }
    
    struct Market {
        uint256 id;
        string title;
        string category; // "sports", "crypto", "politics", etc.
        uint256 points;
        bool isResolved;
        bool outcome; // true/false for binary markets
        string kalshiId;
        uint256 createdAt;
        uint256 resolutionTime;
    }
    
    struct Portfolio {
        uint256 leagueId;
        address user;
        uint256[] selectedMarkets;
        uint256 totalPoints;
        bool hasJoined;
        uint256 joinedAt;
    }
    
    struct UserPrediction {
        uint256 marketId;
        bool prediction;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => League) public leagues;
    mapping(uint256 => Market) public markets;
    mapping(bytes32 => Portfolio) public portfolios; // keccak256(leagueId, userAddress)
    mapping(bytes32 => UserPrediction) public predictions; // keccak256(leagueId, userAddress, marketId)
    mapping(uint256 => address[]) public leagueParticipants;
    mapping(uint256 => uint256[]) public leagueMarkets;
    mapping(address => uint256[]) public userLeagues;
    
    // Admin settings for league types
    mapping(string => uint256) public defaultEntryFees; // leagueType => USDC amount
    mapping(string => bool) public allowedLeagueTypes;
    
    // Events
    event LeagueCreated(uint256 indexed leagueId, string name, address creator, uint256 entryFee);
    event LeagueJoined(uint256 indexed leagueId, address indexed user, uint256 entryFee);
    event MarketCreated(uint256 indexed marketId, string title, string category, uint256 points);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event PortfolioCreated(uint256 indexed leagueId, address indexed user, uint256[] markets);
    event PredictionMade(uint256 indexed leagueId, address indexed user, uint256 indexed marketId, bool prediction);
    event LeagueResolved(uint256 indexed leagueId, address[] winners, uint256[] payouts);
    event PointsAwarded(uint256 indexed leagueId, address indexed user, uint256 points);
    event EntryFeeUpdated(string leagueType, uint256 newFee);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    
    // Modifiers
    modifier leagueExists(uint256 _leagueId) {
        require(_leagueId > 0 && _leagueId <= _leagueIds.current(), "League does not exist");
        _;
    }
    
    modifier marketExists(uint256 _marketId) {
        require(_marketId > 0 && _marketId <= _marketIds.current(), "Market does not exist");
        _;
    }
    
    modifier onlyLeagueCreator(uint256 _leagueId) {
        require(leagues[_leagueId].creator == msg.sender || owner() == msg.sender, "Not authorized");
        _;
    }
    
    modifier validLeagueType(string memory _leagueType) {
        require(allowedLeagueTypes[_leagueType], "Invalid league type");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _usdcToken USDC token contract address on Base
     * @param _feeRecipient Address to receive platform fees
     */
    constructor(address _usdcToken, address _feeRecipient) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        usdcToken = IERC20(_usdcToken);
        feeRecipient = _feeRecipient;
        
        // Initialize default league types and fees
        allowedLeagueTypes["daily"] = true;
        allowedLeagueTypes["weekly"] = true;
        allowedLeagueTypes["monthly"] = true;
        
        // Default entry fees in USDC (6 decimals)
        defaultEntryFees["daily"] = 5 * 10**6;    // $5 USDC
        defaultEntryFees["weekly"] = 10 * 10**6;  // $10 USDC
        defaultEntryFees["monthly"] = 25 * 10**6; // $25 USDC
    }
    
    /**
     * @dev Admin: Set entry fee for a league type
     */
    function setEntryFee(string memory _leagueType, uint256 _entryFee) external onlyOwner {
        require(allowedLeagueTypes[_leagueType], "Invalid league type");
        require(_entryFee > 0, "Entry fee must be > 0");
        
        defaultEntryFees[_leagueType] = _entryFee;
        emit EntryFeeUpdated(_leagueType, _entryFee);
    }
    
    /**
     * @dev Admin: Add/remove league type
     */
    function setLeagueTypeStatus(string memory _leagueType, bool _allowed) external onlyOwner {
        allowedLeagueTypes[_leagueType] = _allowed;
    }
    
    /**
     * @dev Admin: Set platform fee percentage (in basis points)
     */
    function setPlatformFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFeePercentage = _feePercentage;
        emit PlatformFeeUpdated(_feePercentage);
    }
    
    /**
     * @dev Admin: Set fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Creates a new league with fixed entry fee
     */
    function createLeague(
        string memory _name,
        string memory _leagueType,
        uint256 _maxParticipants,
        uint256 _duration
    ) external whenNotPaused validLeagueType(_leagueType) returns (uint256) {
        require(bytes(_name).length > 0, "League name required");
        require(_maxParticipants > 0, "Max participants must be > 0");
        require(_duration > 0, "Duration must be > 0");
        
        _leagueIds.increment();
        uint256 newLeagueId = _leagueIds.current();
        
        uint256 entryFee = defaultEntryFees[_leagueType];
        
        leagues[newLeagueId] = League({
            id: newLeagueId,
            name: _name,
            leagueType: _leagueType,
            entryFee: entryFee,
            maxParticipants: _maxParticipants,
            currentParticipants: 0,
            creator: msg.sender,
            endTime: block.timestamp + _duration,
            isActive: true,
            isResolved: false,
            totalPrizePool: 0
        });
        
        emit LeagueCreated(newLeagueId, _name, msg.sender, entryFee);
        return newLeagueId;
    }
    
    /**
     * @dev Join a league with selected markets (pays in USDC)
     */
    function joinLeague(
        uint256 _leagueId,
        uint256[] memory _selectedMarkets
    ) external leagueExists(_leagueId) nonReentrant whenNotPaused {
        League storage league = leagues[_leagueId];
        
        require(league.isActive, "League not active");
        require(block.timestamp < league.endTime, "League has ended");
        require(league.currentParticipants < league.maxParticipants, "League is full");
        require(_selectedMarkets.length > 0, "Must select at least one market");
        
        bytes32 portfolioKey = keccak256(abi.encodePacked(_leagueId, msg.sender));
        require(!portfolios[portfolioKey].hasJoined, "Already joined this league");
        
        // Validate selected markets exist and are active
        for (uint256 i = 0; i < _selectedMarkets.length; i++) {
            require(_selectedMarkets[i] > 0 && _selectedMarkets[i] <= _marketIds.current(), "Invalid market");
            require(!markets[_selectedMarkets[i]].isResolved, "Market already resolved");
        }
        
        // Transfer USDC from user to contract
        uint256 entryFee = league.entryFee;
        usdcToken.safeTransferFrom(msg.sender, address(this), entryFee);
        
        // Calculate platform fee
        uint256 platformFee = (entryFee * platformFeePercentage) / 10000;
        uint256 prizePoolAmount = entryFee - platformFee;
        
        // Transfer platform fee
        if (platformFee > 0) {
            usdcToken.safeTransfer(feeRecipient, platformFee);
        }
        
        // Create portfolio
        portfolios[portfolioKey] = Portfolio({
            leagueId: _leagueId,
            user: msg.sender,
            selectedMarkets: _selectedMarkets,
            totalPoints: 0,
            hasJoined: true,
            joinedAt: block.timestamp
        });
        
        // Update league data
        league.currentParticipants++;
        league.totalPrizePool += prizePoolAmount;
        leagueParticipants[_leagueId].push(msg.sender);
        userLeagues[msg.sender].push(_leagueId);
        
        emit LeagueJoined(_leagueId, msg.sender, entryFee);
        emit PortfolioCreated(_leagueId, msg.sender, _selectedMarkets);
    }
    
    /**
     * @dev Create a new market
     */
    function createMarket(
        string memory _title,
        string memory _category,
        uint256 _points,
        string memory _kalshiId
    ) external onlyOwner returns (uint256) {
        require(bytes(_title).length > 0, "Market title required");
        require(_points > 0, "Points must be > 0");
        
        _marketIds.increment();
        uint256 newMarketId = _marketIds.current();
        
        markets[newMarketId] = Market({
            id: newMarketId,
            title: _title,
            category: _category,
            points: _points,
            isResolved: false,
            outcome: false,
            kalshiId: _kalshiId,
            createdAt: block.timestamp,
            resolutionTime: 0
        });
        
        emit MarketCreated(newMarketId, _title, _category, _points);
        return newMarketId;
    }
    
    /**
     * @dev Make a prediction for a market in a league
     */
    function makePrediction(
        uint256 _leagueId,
        uint256 _marketId,
        bool _prediction
    ) external leagueExists(_leagueId) marketExists(_marketId) {
        League storage league = leagues[_leagueId];
        Market storage market = markets[_marketId];
        
        require(league.isActive, "League not active");
        require(!market.isResolved, "Market already resolved");
        require(block.timestamp < league.endTime, "League has ended");
        
        bytes32 portfolioKey = keccak256(abi.encodePacked(_leagueId, msg.sender));
        require(portfolios[portfolioKey].hasJoined, "Not in this league");
        
        // Check if market is in user's portfolio
        bool marketInPortfolio = false;
        uint256[] memory selectedMarkets = portfolios[portfolioKey].selectedMarkets;
        for (uint256 i = 0; i < selectedMarkets.length; i++) {
            if (selectedMarkets[i] == _marketId) {
                marketInPortfolio = true;
                break;
            }
        }
        require(marketInPortfolio, "Market not in portfolio");
        
        bytes32 predictionKey = keccak256(abi.encodePacked(_leagueId, msg.sender, _marketId));
        predictions[predictionKey] = UserPrediction({
            marketId: _marketId,
            prediction: _prediction,
            timestamp: block.timestamp
        });
        
        emit PredictionMade(_leagueId, msg.sender, _marketId, _prediction);
    }
    
    /**
     * @dev Resolve a market (admin only)
     */
    function resolveMarket(uint256 _marketId, bool _outcome) external onlyOwner marketExists(_marketId) {
        Market storage market = markets[_marketId];
        require(!market.isResolved, "Market already resolved");
        
        market.isResolved = true;
        market.outcome = _outcome;
        market.resolutionTime = block.timestamp;
        
        emit MarketResolved(_marketId, _outcome);
    }
    
    /**
     * @dev Calculate and award points for a league
     */
    function calculateLeaguePoints(uint256 _leagueId) external onlyLeagueCreator(_leagueId) leagueExists(_leagueId) {
        League storage league = leagues[_leagueId];
        require(league.isActive, "League not active");
        require(block.timestamp >= league.endTime, "League not ended yet");
        
        address[] memory participants = leagueParticipants[_leagueId];
        
        for (uint256 i = 0; i < participants.length; i++) {
            address user = participants[i];
            bytes32 portfolioKey = keccak256(abi.encodePacked(_leagueId, user));
            Portfolio storage portfolio = portfolios[portfolioKey];
            
            uint256 totalPoints = 0;
            
            for (uint256 j = 0; j < portfolio.selectedMarkets.length; j++) {
                uint256 marketId = portfolio.selectedMarkets[j];
                Market storage market = markets[marketId];
                
                if (market.isResolved) {
                    bytes32 predictionKey = keccak256(abi.encodePacked(_leagueId, user, marketId));
                    UserPrediction storage prediction = predictions[predictionKey];
                    
                    if (prediction.prediction == market.outcome) {
                        totalPoints += market.points;
                    }
                }
            }
            
            portfolio.totalPoints = totalPoints;
            emit PointsAwarded(_leagueId, user, totalPoints);
        }
    }
    
    /**
     * @dev Resolve league and distribute USDC prizes
     */
    function resolveLeague(uint256 _leagueId) external onlyLeagueCreator(_leagueId) leagueExists(_leagueId) nonReentrant {
        League storage league = leagues[_leagueId];
        require(league.isActive, "League not active");
        require(block.timestamp >= league.endTime, "League not ended yet");
        require(!league.isResolved, "League already resolved");
        
        league.isActive = false;
        league.isResolved = true;
        
        address[] memory participants = leagueParticipants[_leagueId];
        require(participants.length > 0, "No participants");
        
        // Find winners (top 3)
        address[] memory winners = new address[](3);
        uint256[] memory winnerPoints = new uint256[](3);
        
        for (uint256 i = 0; i < participants.length; i++) {
            address user = participants[i];
            bytes32 portfolioKey = keccak256(abi.encodePacked(_leagueId, user));
            uint256 userPoints = portfolios[portfolioKey].totalPoints;
            
            // Simple top 3 sorting
            if (userPoints > winnerPoints[0]) {
                winnerPoints[2] = winnerPoints[1];
                winners[2] = winners[1];
                winnerPoints[1] = winnerPoints[0];
                winners[1] = winners[0];
                winnerPoints[0] = userPoints;
                winners[0] = user;
            } else if (userPoints > winnerPoints[1]) {
                winnerPoints[2] = winnerPoints[1];
                winners[2] = winners[1];
                winnerPoints[1] = userPoints;
                winners[1] = user;
            } else if (userPoints > winnerPoints[2]) {
                winnerPoints[2] = userPoints;
                winners[2] = user;
            }
        }
        
        // Distribute USDC prizes (60% / 25% / 15%)
        uint256 totalPrize = league.totalPrizePool;
        uint256[] memory payouts = new uint256[](3);
        
        if (winners[0] != address(0) && winnerPoints[0] > 0) {
            payouts[0] = (totalPrize * 60) / 100;
            usdcToken.safeTransfer(winners[0], payouts[0]);
        }
        if (winners[1] != address(0) && winnerPoints[1] > 0) {
            payouts[1] = (totalPrize * 25) / 100;
            usdcToken.safeTransfer(winners[1], payouts[1]);
        }
        if (winners[2] != address(0) && winnerPoints[2] > 0) {
            payouts[2] = (totalPrize * 15) / 100;
            usdcToken.safeTransfer(winners[2], payouts[2]);
        }
        
        emit LeagueResolved(_leagueId, winners, payouts);
    }
    
    /**
     * @dev Get entry fee for a league type
     */
    function getEntryFee(string memory _leagueType) external view returns (uint256) {
        return defaultEntryFees[_leagueType];
    }
    
    /**
     * @dev Get all supported league types with their fees
     */
    function getLeagueTypes() external view returns (string[] memory types, uint256[] memory fees, bool[] memory allowed) {
        string[] memory allTypes = new string[](3);
        allTypes[0] = "daily";
        allTypes[1] = "weekly";
        allTypes[2] = "monthly";
        
        types = new string[](3);
        fees = new uint256[](3);
        allowed = new bool[](3);
        
        for (uint256 i = 0; i < allTypes.length; i++) {
            types[i] = allTypes[i];
            fees[i] = defaultEntryFees[allTypes[i]];
            allowed[i] = allowedLeagueTypes[allTypes[i]];
        }
    }
    
    /**
     * @dev Get league participants
     */
    function getLeagueParticipants(uint256 _leagueId) external view returns (address[] memory) {
        return leagueParticipants[_leagueId];
    }
    
    /**
     * @dev Get user's selected markets for a league
     */
    function getUserPortfolio(uint256 _leagueId, address _user) external view returns (uint256[] memory, uint256) {
        bytes32 portfolioKey = keccak256(abi.encodePacked(_leagueId, _user));
        Portfolio storage portfolio = portfolios[portfolioKey];
        return (portfolio.selectedMarkets, portfolio.totalPoints);
    }
    
    /**
     * @dev Get user's leagues
     */
    function getUserLeagues(address _user) external view returns (uint256[] memory) {
        return userLeagues[_user];
    }
    
    /**
     * @dev Get league leaderboard
     */
    function getLeagueLeaderboard(uint256 _leagueId) external view returns (address[] memory, uint256[] memory) {
        address[] memory participants = leagueParticipants[_leagueId];
        uint256[] memory points = new uint256[](participants.length);
        
        for (uint256 i = 0; i < participants.length; i++) {
            bytes32 portfolioKey = keccak256(abi.encodePacked(_leagueId, participants[i]));
            points[i] = portfolios[portfolioKey].totalPoints;
        }
        
        return (participants, points);
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        usdcToken.safeTransfer(owner(), balance);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get current league and market counts
     */
    function getCounts() external view returns (uint256 leagues_, uint256 markets_) {
        return (_leagueIds.current(), _marketIds.current());
    }
}
