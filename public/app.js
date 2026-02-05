const log = document.getElementById("log");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const clearBtn = document.getElementById("clear");
const useWeb = document.getElementById("useWeb");

let messages = []; // [{role:'user'|'assistant', content:'...'}]

function addBubble(text, who="bot"){
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function addCitations(citations){
  if(!citations || !citations.length) return;
  const div = document.createElement("div");
  div.className = "bubble bot";
  const lines = citations.map((c,i)=>`${i+1}. ${c.title || "Source"} — ${c.url}`);
  div.textContent = "Sources:\n" + lines.join("\n");
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function callAPI(userText){
  addBubble(userText, "user");
  messages.push({role:"user", content:userText});

  addBubble("…", "bot");
  const thinking = log.lastChild;

  const res = await fetch("/api/chat", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      messages,
      web_search: useWeb.checked
    })
  });

  const data = await res.json();
  thinking.remove();

  if(!res.ok){
    addBubble(`Error: ${data.error || "Request failed"}`, "bot");
    return;
  }

  const answer = data.text || "";
  messages.push({role:"assistant", content:answer});
  addBubble(answer, "bot");
  addCitations(data.citations);
}

send.onclick = () => {
  const t = msg.value.trim();
  if(!t) return;
  msg.value = "";
  callAPI(t);
};

msg.addEventListener("keydown", (e)=>{
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    send.click();
  }
});

clearBtn.onclick = () => {
  messages = [];
  log.innerHTML = "";
  addBubble("Cleared. Ask anything.", "bot");
};

addBubble("Hi — ask anything. Turn Web Search ON for up-to-date answers.", "bot");
