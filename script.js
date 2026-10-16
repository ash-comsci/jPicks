"use strict";

// Paste your deployed Google Apps Script web app URL (ending /exec) here.
// Leave blank to keep the original email-free preview.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYZtglmo3VaQgAWFxeRHbQ42d_xUB0orTLlYRvsOuFmmHyqkN3a2FN7b8h-gUKV7KW/exec";
const EMAIL_RECIPIENT = "scottyjamieson29@gmail.com";
const WEEK = 6;
const YEAR = 2026;
// Schedule transcribed from the supplied week5.pdf, including its neutral-site “vs”.
const teams = {
  SEA:["Seattle","Seahawks"], DEN:["Denver","Broncos"],
  HOU:["Houston","Texans"], JAX:["Jacksonville","Jaguars"],
  HOU:["Houston","Texans"], TEN:["Tennessee","Titans"],
  CIN:["Cincinnati","Bengals"], MIA:["Miami","Dolphins"],
  LV:["Las Vegas","Raiders"], NE:["New England","Patriots"],
  MIN:["Minnesota","Vikings"], NO:["New Orleans","Saints"],
  CLE:["Cleveland","Browns"], NYJ:["NY Jets","Jets"],
  IND:["Indianapolis","Colts"], PIT:["Pittsburgh","Steelers"],
  NYG:["NY Giants","Giants"], WAS:["Washington","Commanders"],
  DEN:["Denver","Broncos"], LAC:["LA Chargers","Chargers"],
  CHI:["Chicago","Bears"], GB:["Green Bay","Packers"],
  DET:["Detroit","Lions"], ARI:["Arizona","Cardinals"],
  SF:["San Francisco","49ers"], SEA:["Seattle","Seahawks"],
  BAL:["Baltimore","Ravens"], ATL:["Atlanta","Falcons"],
  BUF:["Buffalo","Bills"], LAR:["LA Rams","Rams"]
};
const games = [
  ["Thursday, Oct. 8","8:15 pm","TB","DAL"],
  ["Sunday, Oct. 11","9:30 am","PHI","JAX","vs"],
  ["Sunday, Oct. 11","1:00 pm","HOU","TEN"],
  ["Sunday, Oct. 11","1:00 pm","CIN","MIA"],
  ["Sunday, Oct. 11","1:00 pm","LV","NE"],
  ["Sunday, Oct. 11","1:00 pm","MIN","NO"],
  ["Sunday, Oct. 11","1:00 pm","CLE","NYJ"],
  ["Sunday, Oct. 11","1:00 pm","IND","PIT"],
  ["Sunday, Oct. 11","1:00 pm","NYG","WAS"],
  ["Sunday, Oct. 11","4:05 pm","DEN","LAC"],
  ["Sunday, Oct. 11","4:25 pm","CHI","GB"],
  ["Sunday, Oct. 11","4:25 pm","DET","ARI"],
  ["Sunday, Oct. 11","4:25 pm","SF","SEA"],
  ["Sunday, Oct. 11","8:20 pm","BAL","ATL"],
  ["Monday, Oct. 12","8:15 pm","BUF","LAR"]
].map(([day,time,away,home,separator="at"],index)=>({id:`game-${index+1}`,day,time,away,home,separator}));

const form = document.querySelector("#picks-form");
const nameInput = document.querySelector("#player-name");
const buffaloScore = document.querySelector("#buffalo-score");
const ramsScore = document.querySelector("#rams-score");
const dialog = document.querySelector("#review-dialog");
const picks = new Map();
let sending = false;
if (APPS_SCRIPT_URL) {
  document.querySelector(".preview-note").textContent = "Game on! Pick every winner and call the Monday night score. Submit your ticket to Scotty.";
  document.querySelector(".preview-caption").textContent = "Your completed ticket will be emailed to Scotty.";
}

function teamOption(code, gameId) {
  const [city, mascot] = teams[code];
  const displayCity = city.startsWith("NY ") ? "New York" : city.startsWith("LA ") ? "Los Angeles" : city;
  return `<label class="team"><input type="radio" name="${gameId}" value="${code}" required aria-label="Pick ${displayCity} ${mascot}"><span class="team-code" aria-hidden="true">${code}</span><span class="team-names"><span class="team-city">${displayCity}</span><span class="team-name">${mascot}</span></span><span class="check" aria-hidden="true">✓</span></label>`;
}

let previousDay = "";
document.querySelector("#games").innerHTML = games.map((game,index)=>{
  const heading = game.day !== previousDay ? `<div class="day-heading"><h3>${game.day}</h3></div>` : "";
  previousDay = game.day;
  const special = game.away === "DEN" ? "LET’S RIDE" : index === 14 ? "MONDAY NIGHT" : `GAME ${String(index+1).padStart(2,"0")}`;
  return `${heading}<fieldset class="game ${game.away === "DEN" ? "broncos" : ""}"><legend><span>${game.time} ET · ${teams[game.away][0]} ${game.separator} ${teams[game.home][0]}</span><span class="game-special">${special}</span></legend><div class="matchup">${teamOption(game.away,game.id)}<span class="at">${game.separator}</span>${teamOption(game.home,game.id)}</div></fieldset>`;
}).join("");

function validScore(input) {
  return input.value !== "" && Number.isInteger(input.valueAsNumber) && input.valueAsNumber >= 0 && input.valueAsNumber <= 99;
}

function updateTicket() {
  nameInput.setCustomValidity(nameInput.value.trim() ? "" : "Please enter your name or nickname.");
  document.querySelector("#picked-count").textContent = picks.size;
  document.querySelector("#pick-progress").value = picks.size;
  document.querySelector("#progress-message").textContent = picks.size === 15 ? "All winners picked. That’s your game plan!" : picks.size === 0 ? "Your winning week starts with one pick." : `${15-picks.size} ${15-picks.size===1?"game":"games"} to go. Keep those picks coming.`;
  const scoresReady = validScore(buffaloScore) && validScore(ramsScore);
  document.querySelector("#total-points").textContent = scoresReady ? buffaloScore.valueAsNumber + ramsScore.valueAsNumber : "—";
  if (!sending) document.querySelector("#form-message").textContent = nameInput.value.trim() && picks.size === 15 && scoresReady ? (APPS_SCRIPT_URL ? "Your ticket is complete. Ready to send!" : "Your ticket is complete. Submit to see your preview!") : "Enter your name, pick all 15 games, and add the final score.";
}

form.addEventListener("change",event=>{
  if(event.target.type === "radio") picks.set(event.target.name,event.target.value);
  updateTicket();
});
form.addEventListener("input",updateTicket);

// This structured object is ready for the future Apps Script submission handler.
function buildSubmission() {
  return {
    recipient:EMAIL_RECIPIENT, week:WEEK, year:YEAR, playerName:nameInput.value.trim(),
    picks:games.map(game=>({gameId:game.id,matchup:`${teams[game.away][0]} ${game.separator} ${teams[game.home][0]}`,selectedTeam:picks.get(game.id),selectedName:teams[picks.get(game.id)][0].endsWith(teams[picks.get(game.id)][1]) ? teams[picks.get(game.id)][0] : teams[picks.get(game.id)].join(" ")})),
    mondayNight:{awayTeam:"Buffalo Bills",awayScore:buffaloScore.valueAsNumber,homeTeam:"LA Rams",homeScore:ramsScore.valueAsNumber,totalPoints:buffaloScore.valueAsNumber+ramsScore.valueAsNumber}
  };
}

form.addEventListener("submit",async event=>{
  event.preventDefault();
  if (sending) return;
  updateTicket();
  if(!form.reportValidity() || picks.size !== games.length) return;
  const submission = buildSubmission();
  if (APPS_SCRIPT_URL) {
    const button = form.querySelector('button[type="submit"]');
    const message = document.querySelector("#form-message");
    sending = true;
    button.disabled = true;
    button.textContent = "Sending your picks…";
    message.textContent = "Keep this page open while your ticket is sent.";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(APPS_SCRIPT_URL)) {
        throw new Error("The email connection needs a valid Apps Script web app URL.");
      }
      // A simple form-encoded POST avoids a cross-origin preflight request.
      // Read the JSON reply; never use no-cors and assume the email was sent.
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST", body: new URLSearchParams({payload: JSON.stringify(submission)}),
        credentials: "omit", redirect: "follow", signal: controller.signal
      });
      if (!response.ok) throw new Error("The email service could not confirm your submission.");
      const result = await response.json();
      if (result.ok !== true) throw new Error(result.error || "Your ticket could not be sent. Please try again.");
      document.querySelector("#review-title").textContent = "Picks sent. Game on!";
      document.querySelector(".review-notice").textContent = result.duplicate ? "This same ticket was already sent. No duplicate email was sent." : "The email service has sent your ticket to Scotty. Good luck this week!";
      document.querySelector(".delivery-note").firstChild.textContent = "Sent to: ";
      message.textContent = "Your ticket has been sent to Scotty.";
    } catch (error) {
      message.textContent = error instanceof TypeError || error.name === "AbortError" || error instanceof SyntaxError
        ? "We couldn’t confirm delivery. Your picks are still here. Ask Scotty to check his inbox, or retry this same ticket; repeats are protected for 6 hours."
        : error.message;
      return;
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = "Submit picks ↗";
    }
  }
  document.querySelector("#review-player").textContent = `${submission.playerName}’s Week ${WEEK} picks`;
  const list = document.querySelector("#review-list");
  list.replaceChildren();
  for(const pick of submission.picks) {
    const item = document.createElement("li");
    const winner = document.createElement("strong");
    winner.textContent = pick.selectedName;
    item.append(`${pick.matchup} → `,winner);
    list.append(item);
  }
  const score = submission.mondayNight;
  document.querySelector("#review-score").textContent = `Monday night: Bills ${score.awayScore} – Rams ${score.homeScore} · Tiebreaker: ${score.totalPoints} total points`;
  document.querySelector("#recipient").textContent = EMAIL_RECIPIENT;
  dialog.showModal();
});
document.querySelector("#edit-picks").addEventListener("click",()=>dialog.close());
updateTicket();

