import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCFEFJNv2yQiE-6tboIyixvZhE37gwrI9s",
  authDomain: "turf-auction.firebaseapp.com",
  databaseURL: "https://turf-auction-default-rtdb.firebaseio.com",
  projectId: "turf-auction",
  storageBucket: "turf-auction.appspot.com",
  messagingSenderId: "432815920384",
  appId: "1:432815920384:web:532231c1b1f2e423becfe5",
  measurementId: "G-9FRTDKWXV2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let lastCompleted = null;
let players = [];
let currentPlayer = '';
let currentBidValue = 0;
let currentTeam = '';
let budgets = {
  Yellow: 2,
  Green: 2,
  Blue: 2,
  Black: 2,
  Red: 2,
  White: 2
};
let soldPlayers = {};
let unsoldPlayers = [];
let hasFirstBid = false;
let bidIncrement = 0.2;
let basePrice = 2;
let bidHistory = [];

const correctPassword = "Auctionarivu";

function updateAuctionData() {
  update(ref(db, 'auction'), {
    players,
    currentPlayer,
    currentBidValue,
    currentTeam,
    budgets,
    soldPlayers,
    unsoldPlayers,
    hasFirstBid,
    bidIncrement,
    basePrice,
    bidHistory,
    lastCompleted
  });
}

const auctionRef = ref(db, 'auction');
onValue(auctionRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  players = data.players || [];
  currentPlayer = data.currentPlayer || '';
  currentBidValue = data.currentBidValue || 0;
  currentTeam = data.currentTeam || '';
  budgets = data.budgets || budgets;
  soldPlayers = data.soldPlayers || {};
  unsoldPlayers = data.unsoldPlayers || [];
  hasFirstBid = data.hasFirstBid || false;
  bidIncrement = data.bidIncrement || 0.2;
  basePrice = data.basePrice || 2;
  bidHistory = data.bidHistory || [];
  lastCompleted = data.lastCompleted || null;

  updateUI();
});

function updateUI() {
  document.getElementById("currentPlayer").innerText = currentPlayer || "Select Next Player";

  let bidText = `Base Price: ${basePrice} Cr`;
  if (currentBidValue && currentTeam) {
    bidText += ` | Current Bid: ${currentBidValue} Cr (${currentTeam})`;
  } else if (currentBidValue) {
    bidText += ` | Current Bid: ${currentBidValue} Cr`;
  }
  document.getElementById("currentBid").innerText = bidText;

  document.getElementById("yellowBudget").innerText = `${budgets.Yellow.toFixed(1)} Cr`;
  document.getElementById("greenBudget").innerText = `${budgets.Green.toFixed(1)} Cr`;
  document.getElementById("blueBudget").innerText = `${budgets.Blue.toFixed(1)} Cr`;
  document.getElementById("blackBudget").innerText = `${budgets.Black.toFixed(1)} Cr`;
  document.getElementById("redBudget").innerText = `${budgets.Red.toFixed(1)} Cr`;
  document.getElementById("whiteBudget").innerText = `${budgets.White.toFixed(1)} Cr`;

  const soldListElems = {
    Yellow: document.getElementById("yellowList"),
    Green: document.getElementById("greenList"),
    Blue: document.getElementById("blueList"),
    Black: document.getElementById("blackList"),
    Red: document.getElementById("redList"),
    White: document.getElementById("whiteList")
  };

  for (const team in soldListElems) {
    soldListElems[team].innerHTML = "";
    if (soldPlayers[team]) {
      soldPlayers[team].forEach((p) => {
        const li = document.createElement("li");
        li.innerText = `${p.name} - ${p.price} Cr`;
        soldListElems[team].appendChild(li);
      });
    }
  }

  const unsoldElem = document.getElementById("unsoldList");
  unsoldElem.innerHTML = "";
  unsoldPlayers.forEach((p) => {
    const li = document.createElement("li");
    li.innerText = p;
    unsoldElem.appendChild(li);
  });

  const playerListElem = document.getElementById("playerList");
  playerListElem.innerHTML = "";
  players.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerText = p;
    playerListElem.appendChild(li);
  });

  const undoBtn = document.getElementById("undoSoldBtn");
  if (undoBtn) {
    undoBtn.disabled = !lastCompleted;
  }
}

function getTeamColor(team) {
  switch (team) {
    case "Yellow": return "#ffeb3b";
    case "Green": return "#4caf50";
    case "Blue": return "#2196f3";
    case "Black": return "#212121";
    case "Red": return "#f44336";
    case "White": return "#e0e0e0";
    default: return "#ffffff";
  }
}

window.openSettings = function() {
  document.getElementById("settingsPanel").classList.toggle("hidden");
}

window.checkPassword = function() {
  const pass = document.getElementById("settingsPassword").value;
  if (pass === correctPassword) {
    document.getElementById("settingsContent").classList.remove("hidden");
    document.getElementById("playerInput").disabled = false;
    document.getElementById("addPlayerBtn").disabled = false;
    document.getElementById("bidIncrement").disabled = false;
    document.getElementById("nextPlayerBtn").disabled = false;
    document.querySelectorAll(".bid-btn").forEach(btn => btn.disabled = false);
    document.querySelectorAll(".action-btn").forEach(btn => btn.disabled = false);
  } else {
    alert("Wrong password!");
  }
}

window.applyPurseSettings = function() {
  const purse = parseFloat(document.getElementById("commonPurse").value) || 20;
  budgets.Yellow = purse;
  budgets.Green = purse;
  budgets.Blue = purse;
  budgets.Black = purse;
  budgets.Red = purse;
  budgets.White = purse;
  basePrice = parseFloat(document.getElementById("basePriceInput").value) || 2;
  bidIncrement = parseFloat(document.getElementById("bidIncrement").value) || 0.2;
  updateAuctionData();
}

window.addPlayer = function() {
  let name = document.getElementById("playerInput").value.trim();
  if (name) {
    name = name.replace(/^\d+\.\s*/, "");
    players.push(name);
    document.getElementById("playerInput").value = "";
    updateAuctionData();
  }
}

window.nextPlayer = function() {
  if (players.length === 0) return;
  let index = Math.floor(Math.random() * players.length);
  currentPlayer = players.splice(index, 1)[0];
  currentBidValue = basePrice;
  currentTeam = '';
  hasFirstBid = false;
  bidHistory = [];
  updateAuctionData();
}

window.bid = function(team) {
  if (!currentPlayer) {
    alert("Please select a player first!");
    return;
  }
  if (budgets[team] <= 0) {
    alert(`${team} has no purse left!`);
    return;
  }
  if (!hasFirstBid) {
    hasFirstBid = true;
    currentTeam = team;
    currentBidValue = basePrice;
  } else {
    bidHistory.push({ value: currentBidValue, team: currentTeam });
    let nextBid = parseFloat((currentBidValue + bidIncrement).toFixed(1));
    if (budgets[team] >= nextBid) {
      currentBidValue = nextBid;
      currentTeam = team;
    } else {
      alert(`${team} does not have enough purse!`);
      return;
    }
  }
  updateAuctionData();
};

window.undoBid = function() {
  if (!hasFirstBid || bidHistory.length === 0) {
    alert("Cannot undo further!");
    return;
  }
  let last = bidHistory.pop();
  currentBidValue = last.value;
  currentTeam = last.team;
  if (bidHistory.length === 0) {
    hasFirstBid = false;
  }
  updateAuctionData();
};

window.markAsSold = function() {
  if (!currentPlayer || !currentTeam) return;
  if (!soldPlayers[currentTeam]) {
    soldPlayers[currentTeam] = [];
  }
  soldPlayers[currentTeam].push({
    name: currentPlayer,
    price: currentBidValue
  });
  budgets[currentTeam] = parseFloat((budgets[currentTeam] - currentBidValue).toFixed(1));

  const highlight = document.querySelector(".player-highlight");
  if (highlight) {
    highlight.style.transition = "background 0.6s";
    highlight.style.background = getTeamColor(currentTeam);
    setTimeout(() => {
      highlight.style.background = "linear-gradient(135deg, #f7971e, #ffd200)";
    }, 1500);
  }
  
  lastCompleted = {
    player: currentPlayer,
    bid: currentBidValue,
    team: currentTeam,
    type: 'sold'
  };

  currentPlayer = "";
  currentBidValue = 0;
  currentTeam = "";
  hasFirstBid = false;
  bidHistory = [];
  updateAuctionData();
}

window.markAsUnsold = function() {
  if (!currentPlayer) return;
  unsoldPlayers.push(currentPlayer);

  lastCompleted = {
    player: currentPlayer,
    bid: currentBidValue,
    team: null,
    type: 'unsold'
  };

  currentPlayer = "";
  currentBidValue = 0;
  currentTeam = "";
  hasFirstBid = false;
  bidHistory = [];
  updateAuctionData();
}

window.undoSoldUnsold = function() {
  if (!lastCompleted) {
    alert("Nothing to undo!");
    return;
  }

  if (lastCompleted.type === 'sold') {
    // Undo sold player
    let teamList = soldPlayers[lastCompleted.team];
    if (teamList && teamList.length > 0) {
      teamList.pop();
      budgets[lastCompleted.team] = parseFloat((budgets[lastCompleted.team] + lastCompleted.bid).toFixed(1));
    }
  } else if (lastCompleted.type === 'unsold') {
    // Find and remove last unsold player by name
    let index = unsoldPlayers.lastIndexOf(lastCompleted.player);
    if (index !== -1) {
      unsoldPlayers.splice(index, 1);
    }
  }

  // Bring back player for re-auction
  currentPlayer = lastCompleted.player;
  currentBidValue = lastCompleted.bid || basePrice;
  currentTeam = lastCompleted.team || "";
  hasFirstBid = !!lastCompleted.team;

  // Clear last completed action
  lastCompleted = null;

  updateAuctionData();
};

window.resetBid = function() {
  currentBidValue = basePrice;
  currentTeam = "";
  hasFirstBid = false;
  bidHistory = [];
  updateAuctionData();
}

window.resetAllAuction = function() {
  players = [];
  currentPlayer = '';
  currentBidValue = 0;
  currentTeam = '';
  budgets = {
    Yellow: 2,
    Green: 2,
    Blue: 2,
    Black: 2,
    Red: 2,
    White: 2
  };
  soldPlayers = {};
  unsoldPlayers = [];
  hasFirstBid = false;
  bidIncrement = 0.2;
  basePrice = 2;
  bidHistory = [];
  lastCompleted = null;
  updateAuctionData();
}

window.exportAuctionData = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Auction Summary", 14, 20);

  let startY = 30;

  // Sold Players per team
  for (const team in soldPlayers) {
    let teamData = soldPlayers[team]?.map(p => [p.name, `${p.price} Cr`]) || [];
    if (teamData.length === 0) {
      teamData = [["No players", "-"]];
    }

    doc.autoTable({
      startY,
      head: [[`${team} (Purse Left: ${budgets[team].toFixed(1)} Cr)`, "Price"]],
      body: teamData,
      headStyles: {
        fillColor: getTeamColor(team),
        textColor: team === "Yellow" || team === "White" ? "#000" : "#FFF",
      },
      theme: 'striped'
    });

    startY = doc.previousAutoTable.finalY + 10;
  }

  // Unsold Players
  let unsoldData = unsoldPlayers.map(p => [p]);
  if (unsoldData.length === 0) {
    unsoldData = [["None"]];
  }

  doc.autoTable({
    startY,
    head: [["Unsold Players"]],
    body: unsoldData,
    headStyles: {
      fillColor: [244, 67, 54], // Red gradient head
      textColor: "#FFF",
    },
    theme: 'striped'
  });

  doc.save("auction_summary.pdf");
};
