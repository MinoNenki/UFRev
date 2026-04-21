const fs = require("fs");
const path = require("path");

function write(filePath, content) {
const fullPath = path.join(process.cwd(), filePath);
fs.mkdirSync(path.dirname(fullPath), { recursive: true });
fs.writeFileSync(fullPath, content);
console.log("✔ Created:", filePath);
}

// 🎨 GLOBAL STYLE
write("styles/global.css", `
body {
background: radial-gradient(circle at 20% 20%, #00ffb210, transparent),
radial-gradient(circle at 80% 80%, #4f8cff10, transparent),
#0e141f;
color: #eafff7;
font-family: Inter, sans-serif;
}

.glow {
box-shadow: 0 0 30px rgba(0,255,178,0.2);
}

.card {
background: rgba(255,255,255,0.04);
backdrop-filter: blur(25px);
border: 1px solid rgba(0,255,178,0.15);
border-radius: 20px;
padding: 20px;
}
`);

// 🧠 DECISION FEED
write("components/feed/DecisionFeed.tsx", `export default function DecisionFeed() { return ( <div className="card"> <h2>Decision Feed</h2> <p>Recent analyses will appear here.</p> </div> ); }`);

// 🔁 WHAT IF SIMULATOR
write("components/whatif/Simulator.tsx", `
"use client";
import { useState } from "react";

export default function Simulator() {
const [price, setPrice] = useState(30);
const [cost, setCost] = useState(10);

const margin = ((price - cost) / price) * 100;

return (

What-if Simulator
<input
type="range"
min="10"
max="100"
value={price}
onChange={(e) => setPrice(Number(e.target.value))}
/>
<input
type="range"
min="1"
max="50"
value={cost}
onChange={(e) => setCost(Number(e.target.value))}
/>
Margin: {margin.toFixed(2)}%

);
}
`);

// 💾 SAVE BUTTON
write("components/save/SaveButton.tsx", `export default function SaveButton() { return <button className="glow">Save decision</button>; }`);

// 🔁 RECHECK BUTTON
write("components/recheck/RecheckButton.tsx", `export default function RecheckButton() { return <button className="glow">Re-analyze</button>; }`);

console.log("\n🔥 UPGRADE INSTALLED SUCCESSFULLY!");