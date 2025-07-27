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
let currentIndex = 0;
let soldPlayers = {};
let unsoldPlayers = [];
let hasFirstBid = false;
let bidIncrement = 0.2;
let thresholdValue = 1;
let incrementAfterThreshold = 0.5;
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

  document.getElementById("yellowBudget").innerText = `${budgets.Yellow.toFixed(2)} Cr`;
  document.getElementById("greenBudget").innerText = `${budgets.Green.toFixed(2)} Cr`;
  document.getElementById("blueBudget").innerText = `${budgets.Blue.toFixed(2)} Cr`;
  document.getElementById("blackBudget").innerText = `${budgets.Black.toFixed(2)} Cr`;
  document.getElementById("redBudget").innerText = `${budgets.Red.toFixed(2)} Cr`;
  document.getElementById("whiteBudget").innerText = `${budgets.White.toFixed(2)} Cr`;

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

window.swapUnsoldPlayers = function () {
  // Normalize all entries to string names
  players = unsoldPlayers.map(player =>
    typeof player === "string" ? player : player.name
  );
  currentIndex = 0;
  unsoldPlayers = [];
  currentPlayer = null;
  updateAuctionData();
  alert("Unsold players moved back to the main list!");
};

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
  thresholdValue = parseFloat(document.getElementById("thresholdValue").value) || 1; // new
  incrementAfterThreshold = parseFloat(document.getElementById("incrementAfterThreshold").value) || 0.5; // new

  updateAuctionData();
};

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

    let incrementToUse = bidIncrement;

    // Use higher increment after threshold
    if (currentBidValue >= thresholdValue) {
      incrementToUse = incrementAfterThreshold;
    }

    let nextBid = parseFloat((currentBidValue + incrementToUse).toFixed(2));

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
  budgets[currentTeam] = parseFloat((budgets[currentTeam] - currentBidValue).toFixed(2));

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
      budgets[lastCompleted.team] = parseFloat((budgets[lastCompleted.team] + lastCompleted.bid).toFixed(2));
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

  const teamNames = ["Yellow", "Green", "Blue", "Black", "Red", "White"];
  const teamColors = {
    Yellow: [255, 235, 59],
    Green: [76, 175, 80],
    Blue: [33, 150, 243],
    Black: [33, 33, 33],
    Red: [244, 67, 54],
    White: [224, 224, 224],
    Unsold: [255, 99, 132]
  };

  // Prepare header labels with purse
  const headers = teamNames.map(team => `${team}\n(${budgets[team].toFixed(1)} Cr)`);
  headers.push("Unsold");

  // Prepare rows
  const maxRows = Math.max(
    ...teamNames.map(team => (soldPlayers[team] ? soldPlayers[team].length : 0)),
    unsoldPlayers.length
  );

  const rows = [];
  for (let i = 0; i < maxRows; i++) {
    const row = [];
    for (const team of teamNames) {
      if (soldPlayers[team] && soldPlayers[team][i]) {
        const p = soldPlayers[team][i];
        row.push(`${p.name}\n${p.price} Cr`);
      } else {
        row.push("");
      }
    }
    row.push(unsoldPlayers[i] || "");
    rows.push(row);
  }

  const headerColors = teamNames.map(t => teamColors[t]);
  headerColors.push(teamColors.Unsold);

  const headerTextColors = teamNames.map(t => (t === "Yellow" || t === "White" ? [0, 0, 0] : [255, 255, 255]));
  headerTextColors.push([255, 255, 255]); // Unsold text color

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 20,
    styles: {
      fontSize: 7,
      cellPadding: 1,
      valign: 'middle',
      halign: 'center',
      lineColor: [44, 62, 80],
      lineWidth: 0.3
    },
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255], // Dummy; override below
      textColor: [0, 0, 0],
      fontSize: 8,
      fontStyle: 'bold'
    },
    didDrawCell: function(data) {
      if (data.section === 'head') {
        const colIdx = data.column.index;
        const color = headerColors[colIdx];
        const textColor = headerTextColors[colIdx];

        // Fill background
        doc.setFillColor(...color);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');

        // Set text color
        doc.setTextColor(...textColor);

        // Text lines (split on \n for purse line)
        const lines = data.cell.raw.split("\n");
        const cellX = data.cell.x + data.cell.width / 2;
        const cellY = data.cell.y + data.cell.height / 2;

        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');

        if (lines.length === 2) {
          doc.text(lines[0], cellX, cellY - 2, { align: 'center', baseline: 'middle' });
          doc.text(lines[1], cellX, cellY + 3, { align: 'center', baseline: 'middle' });
        } else {
          doc.text(lines[0], cellX, cellY, { align: 'center', baseline: 'middle' });
        }

        // Clear autoTable's default text
        data.cell.text = '';
      }
    }
  });

  doc.save("auction_summary.pdf");
};
