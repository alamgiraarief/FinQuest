import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";

/* ─── FONTS ─────────────────────────────────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --bg:#060608;--surface:#0c0c10;--card:#111116;--border:#1c1c24;
      --g:#00ff88;--g2:#00cc6a;--g3:rgba(0,255,136,0.08);
      --amber:#f5a623;--red:#ff3b5c;--blue:#3b82f6;
      --t1:#e8e8f0;--t2:#8888a0;--t3:#444458;
      --fh:'Rajdhani',sans-serif;--fm:'JetBrains Mono',monospace;--fb:'Outfit',sans-serif;
      --r:10px;
    }
    html,body{background:var(--bg);color:var(--t1);font-family:var(--fb);overflow-x:hidden;}
    ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:var(--bg);}
    ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
    button{cursor:pointer;border:none;outline:none;font-family:var(--fb);}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
    @keyframes tick{from{transform:scaleX(0);}to{transform:scaleX(1);}}
    @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(0,255,136,.3);}50%{box-shadow:0 0 24px rgba(0,255,136,.7);}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:none;}}
    .fade-up{animation:fadeUp .4s ease both;}
    .pulse{animation:pulse 2s ease infinite;}
  `}</style>
);

/* ─── DATA ───────────────────────────────────────────────────────────────────── */
const LIFE_EVENTS = [
  {id:"job_loss",era:"Early Career",age:22,icon:"📉",title:"Layoff",type:"risk",
   desc:"Your company downsizes. 3 months severance. What do you do?",
   choices:[
    {t:"Take any job immediately",nw:-12000,hap:-5,str:+10,elo:-8,beh:"risk_averse",lesson:"Stability costs growth. Lower pay now = less compounding later."},
    {t:"Upskill for 6 months",nw:-22000,hap:+8,str:+18,elo:+5,beh:"growth",lesson:"Investing in yourself is the highest-return investment."},
    {t:"Start freelancing",nw:-4000,hap:+12,str:+22,elo:+12,beh:"entrepreneur",lesson:"Entrepreneurship: high variance, high upside."},
  ]},
  {id:"market_boom",era:"Building",age:27,icon:"🚀",title:"Bull Market",type:"opp",
   desc:"Markets up 45% this year. You have £40K in savings doing nothing.",
   choices:[
    {t:"Invest everything now",nw:+28000,hap:+6,str:+12,elo:+8,beh:"aggressive",lesson:"Lump-sum beats DCA ~66% of the time. But volatility is real."},
    {t:"Dollar-cost average in",nw:+18000,hap:+10,str:+4,elo:+15,beh:"disciplined",lesson:"DCA removes timing risk. Slow and steady compounds."},
    {t:"Keep in savings — too risky",nw:+800,hap:+4,str:-6,elo:-15,beh:"fearful",lesson:"Cash loses to inflation every year. Inaction has a cost."},
  ]},
  {id:"housing",era:"Building",age:29,icon:"🏠",title:"Rent vs Buy?",type:"decision",
   desc:"Mortgage: £2,100/mo. Rent: £1,350/mo. Same area. 5-year horizon.",
   choices:[
    {t:"Buy — build equity",nw:+35000,hap:+10,str:+14,elo:+6,beh:"traditional",lesson:"Owning builds equity, but ties up capital. The math is closer than most think."},
    {t:"Rent + invest the difference",nw:+22000,hap:+6,str:-4,elo:+10,beh:"analytical",lesson:"Renting beats buying only if you ACTUALLY invest the savings."},
    {t:"Rent for flexibility",nw:0,hap:+14,str:-10,elo:+2,beh:"flexible",lesson:"Optionality has value, especially early career."},
  ]},
  {id:"crash",era:"The Thirties",age:32,icon:"💥",title:"Market Crash −38%",type:"risk",
   desc:"Recession hits. Your portfolio is down £28,000. Markets in freefall.",
   choices:[
    {t:"Sell everything — go to cash",nw:-55000,hap:-18,str:+8,elo:-35,beh:"panic",lesson:"Panic selling is the most expensive mistake in investing. Every.single.time."},
    {t:"Hold — don't panic",nw:-18000,hap:-8,str:+20,elo:+20,beh:"disciplined",lesson:"Investors who held through 2008 recovered everything within 4 years."},
    {t:"Buy more — markets are cheap",nw:+12000,hap:+4,str:+26,elo:+40,beh:"contrarian",lesson:"Be greedy when others are fearful. The hardest and most profitable move."},
  ]},
  {id:"startup",era:"The Thirties",age:34,icon:"⚡",title:"Startup Bet",type:"opp",
   desc:"Friend offers 8% equity in a startup. Needs £25K and your evenings.",
   choices:[
    {t:"Go all-in — quit your job",nw:Math.random()>.4?+280000:-38000,hap:+14,str:+32,elo:+18,beh:"high_risk",lesson:"Most startups fail. A few change your life. High variance is the whole point."},
    {t:"Invest £25K, keep day job",nw:Math.random()>.5?+90000:-25000,hap:+10,str:+14,elo:+12,beh:"balanced",lesson:"Hedging risk limits downside — and upside. Position sizing matters."},
    {t:"Pass — too risky",nw:0,hap:-4,str:-4,elo:-5,beh:"risk_averse",lesson:"FOMO is real. So is capital preservation. Context matters."},
  ]},
  {id:"inheritance",era:"Peak Earnings",age:41,icon:"📜",title:"Unexpected Inheritance",type:"opp",
   desc:"A relative leaves you £75,000. Completely unexpected.",
   choices:[
    {t:"Invest all in index funds",nw:+75000,hap:+10,str:-6,elo:+20,beh:"disciplined",lesson:"Windfall + index fund + time = compounding supercharger."},
    {t:"Pay off mortgage",nw:+75000,hap:+20,str:-22,elo:+14,beh:"conservative",lesson:"Guaranteed returns from debt payoff often beat market returns."},
    {t:"Spend half, invest half",nw:+37000,hap:+26,str:-4,elo:+8,beh:"balanced",lesson:"Balance present joy and future security. Neither extreme is optimal."},
  ]},
  {id:"crypto",era:"Peak Earnings",age:43,icon:"🪙",title:"Crypto Mania",type:"opp",
   desc:"Colleagues doubling money on crypto. You have £30K to deploy.",
   choices:[
    {t:"All-in — one coin",nw:Math.random()>.55?+120000:-30000,hap:0,str:+28,elo:-20,beh:"gambling",lesson:"Concentration risk: massive upside, catastrophic downside. This is speculation, not investing."},
    {t:"5% allocation only",nw:Math.random()>.4?+8000:-1500,hap:+6,str:+6,elo:+8,beh:"analytical",lesson:"Position sizing is more important than asset selection."},
    {t:"Index funds — boring wins",nw:+9000,hap:+6,str:-4,elo:+18,beh:"disciplined",lesson:"Boring beats flashy over decades. Consistently. Without exception."},
  ]},
  {id:"medical",era:"Mid-Life",age:48,icon:"🏥",title:"Medical Emergency",type:"risk",
   desc:"Family needs surgery. Insurance covers 60%. Your share: £32,000.",
   choices:[
    {t:"Emergency fund covers it",nw:-32000,hap:-8,str:+14,elo:+22,beh:"prepared",lesson:"Emergency funds exist for exactly this. 3-6 months expenses is non-negotiable."},
    {t:"Credit card — pay over time",nw:-46000,hap:-14,str:+28,elo:-18,beh:"unprepared",lesson:"18-25% interest on medical debt can haunt you for years. Avoid at all costs."},
    {t:"Partial savings + payment plan",nw:-32000,hap:-6,str:+10,elo:+10,beh:"analytical",lesson:"Medical debt is negotiable. Always ask. Most hospitals will work with you."},
  ]},
  {id:"recession_2",era:"Late Career",age:53,icon:"📊",title:"Recession −22%",type:"risk",
   desc:"Economy contracts. Portfolio drops. Layoffs everywhere. Your job feels shaky.",
   choices:[
    {t:"Shift to bonds — reduce risk",nw:-8000,hap:-4,str:+8,elo:-5,beh:"conservative",lesson:"De-risking makes sense near retirement. Sequence-of-returns risk is real."},
    {t:"Stay the course",nw:-16000,hap:-6,str:+16,elo:+18,beh:"disciplined",lesson:"Time in market beats timing the market. Stay disciplined."},
    {t:"Buy aggressively — cheap prices",nw:+10000,hap:+4,str:+24,elo:+30,beh:"contrarian",lesson:"At 53 you still have 10+ years of compounding. Recoveries reward patience."},
  ]},
  {id:"pension",era:"Pre-Retirement",age:62,icon:"💰",title:"Pension or Lump Sum?",type:"decision",
   desc:"Retire option: £380K lump sum OR £2,100/month guaranteed for life.",
   choices:[
    {t:"Lump sum — invest myself",nw:+380000,hap:+10,str:+16,elo:+5,beh:"aggressive",lesson:"Self-managing £380K requires iron discipline. Most retirees spend it too fast."},
    {t:"Monthly pension — guaranteed",nw:+252000,hap:+22,str:-22,elo:+12,beh:"conservative",lesson:"Longevity risk is real. Guaranteed income is underrated."},
    {t:"Partial lump + reduced pension",nw:+310000,hap:+16,str:-4,elo:+20,beh:"balanced",lesson:"Diversifying income streams in retirement is optimal for most people."},
  ]},
];

const TIME_MACHINE = [
  {id:"gfc",title:"2008 Global Financial Crisis",icon:"💥",color:"#ff3b5c",
   setup:"September 2008. Lehman Brothers just collapsed. S&P 500 down 42% YTD and falling. Your £100K portfolio is now worth £58K.",
   data:[100,98,92,80,68,58,54,58,65,72,80,90,100,112,125,138,152,168],
   marker:4,
   options:[
    {t:"Sell everything — move to cash",outcome:-42,elo:-40,insight:"Locked in losses. Markets fully recovered by 2012. Investors who fled missed a 200% gain over the next decade."},
    {t:"Hold — don't touch it",outcome:+68,elo:+25,insight:"Painful but correct. Portfolio recovered within 4 years and more than doubled by 2018."},
    {t:"Buy more at these prices",outcome:+120,elo:+45,insight:"Legendary move. Investors who bought the fear earned 3× their money within 5 years."},
    {t:"Rebalance to 50/50",outcome:+45,elo:+15,insight:"Sensible risk management. Reduced downside while still participating in the recovery."},
  ]},
  {id:"dotcom",title:"Dot-com Bubble Peak",icon:"💻",color:"#f5a623",
   setup:"January 2000. NASDAQ up 400% in 4 years. Your tech portfolio is up 180%. PE ratios at 80×. Everyone says 'this time is different.'",
   data:[100,115,130,150,170,190,210,175,140,110,85,70,60,55,58,65,72,80],
   marker:6,
   options:[
    {t:"Buy more — this is the future",outcome:-75,elo:-45,insight:"FOMO at peak. NASDAQ fell 78% from this point. Most dot-com stocks went to zero."},
    {t:"Take profits — sell 60%",outcome:+35,elo:+40,insight:"Perfect execution. You locked in gains before the collapse. Value stocks outperformed for the next decade."},
    {t:"Hold — long-term conviction",outcome:-45,elo:-10,insight:"Conviction is valuable. But at 80× earnings, even good companies were priced for perfection."},
    {t:"Diversify into value/bonds",outcome:+20,elo:+35,insight:"Excellent rebalancing. Value stocks and bonds crushed growth for the next 10 years after the bust."},
  ]},
  {id:"covid",title:"COVID Crash — March 2020",icon:"🦠",color:"#3b82f6",
   setup:"March 16, 2020. Markets down 35% in 3 weeks. Global lockdowns. Pandemic declared. You have £50K to deploy. Nobody knows how long this lasts.",
   data:[100,94,85,72,65,60,65,72,80,90,98,108,120,132,145,158,172,185],
   marker:5,
   options:[
    {t:"Wait — could get much worse",outcome:+15,elo:-10,insight:"Understandable fear. But markets bottomed that week. Waiting cost you 60% in gains."},
    {t:"Invest all £50K now",outcome:+85,elo:+40,insight:"This was the buying opportunity of a generation. Markets nearly tripled within 2 years."},
    {t:"DCA over next 6 months",outcome:+60,elo:+28,insight:"Disciplined and smart. You captured most of the recovery with reduced timing risk."},
    {t:"Buy beaten-down sectors",outcome:+110,elo:+35,insight:"Travel/hospitality fell 70%. The recovery was enormous — if you chose survivors."},
  ]},
  {id:"inflation22",title:"Inflation Surge 2022",icon:"📈",color:"#00ff88",
   setup:"January 2022. Inflation hits 9%. Fed starts hiking rates aggressively. Both stocks AND bonds falling simultaneously. Your 60/40 portfolio is down 18%.",
   data:[100,97,92,86,80,76,74,72,74,76,79,82,85,88,91,94,97,100],
   marker:6,
   options:[
    {t:"Add commodities as inflation hedge",outcome:+12,elo:+38,insight:"Perfect macro call. Commodities surged 30-40% in 2022 as everything else fell."},
    {t:"Short-duration bonds only",outcome:+5,elo:+25,insight:"Correct. Duration risk was the killer in 2022. Short bonds lost far less."},
    {t:"Hold 60/40 — it always works",outcome:-20,elo:-25,insight:"2022 was the worst year for 60/40 since the 1970s. Macro regime shifts matter."},
    {t:"Move to cash entirely",outcome:-5,elo:-8,insight:"Cash felt safe but earned negative real returns. Timing re-entry is nearly impossible."},
  ]},
];

const DECISION_LAB = [
  {q:"You're 28 with £20K savings. Market drops 30% overnight.",
   ctx:"Most people: 67% sell or do nothing. Experts: buy or hold.",
   opts:["Sell everything","Buy aggressively","Hold and wait","Split: hold + buy some"],
   correct:1,expert:3,
   outcome:"Markets recovered 100% within 18 months. Buyers doubled their investment.",
   elo:[-30,+35,+10,+20]},
  {q:"You get a £5,000 bonus. Should you invest it or pay off your 4% mortgage?",
   ctx:"Most people: spend it. Experts: compare guaranteed return vs expected market return.",
   opts:["Pay off mortgage (4% return)","Invest in index fund (est. 7-10%)","Split 50/50","Spend it — you earned it"],
   correct:1,expert:1,
   outcome:"Over 20 years, investing beats 4% debt payoff — but only if you have an emergency fund first.",
   elo:[+5,+20,+15,-20]},
  {q:"Your friend's startup IPO'd. Everyone you know made 300%. You have £10K.",
   ctx:"Most people: FOMO buy. Experts: wait for post-IPO lockup expiry.",
   opts:["Buy at IPO price","Wait 3-6 months for lockup expiry","Avoid — too speculative","Research fundamentals first"],
   correct:3,expert:3,
   outcome:"Most IPOs underperform in the first year. The rush to buy is FOMO, not analysis.",
   elo:[-25,+5,-10,+30]},
  {q:"You're 45. Should you hold 80% stocks or shift to 60% stocks / 40% bonds?",
   ctx:"Depends on: risk tolerance, retirement age, other income sources.",
   opts:["Stay 80% stocks — need growth","Shift to 60/40 — reduce risk","100% bonds — safety first","Ask a financial advisor"],
   correct:1,expert:3,
   outcome:"At 45, you still have 20+ years. The common rule (110 - age = % stocks) suggests 65% stocks is reasonable.",
   elo:[+8,-5,-25,+20]},
  {q:"Market is at all-time highs. Is it a bad time to invest?",
   ctx:"Most people think yes. Historical data says otherwise.",
   opts:["Yes — wait for a correction","No — invest anyway","Invest only half now","Depends on your horizon"],
   correct:1,expert:3,
   outcome:"Markets are at all-time highs ~30% of the time. Studies show investing at ATH beats waiting for dips over 10+ years.",
   elo:[-20,+15,+5,+25]},
];

const FLASHCARDS = [
  {topic:"Investing",q:"What is compound interest?",a:"Returns generating returns. £1,000 at 8% becomes £10,063 in 30 years.",ex:"Start at 25 vs 35: the difference is £400,000+ at retirement.",app:"Time is the most powerful variable. Start yesterday."},
  {topic:"Behavioral",q:"What is loss aversion?",a:"Losses feel ~2× more painful than equivalent gains feel good (Kahneman).",ex:"Losing £100 hurts more than gaining £100 feels good.",app:"This causes holding losers too long and selling winners too early."},
  {topic:"Investing",q:"Why do index funds beat most active managers?",a:"Fees compound against you. Most active managers underperform their benchmark over 10 years.",ex:"1.5% annual fee on £100K = £100,000 lost over 30 years.",app:"Low cost + time + diversification = wealth."},
  {topic:"Behavioral",q:"What is the 'endowment effect'?",a:"We value things we own more than equivalent things we don't.",ex:"Refusing to sell a stock at a loss even when fundamentals changed.",app:"Ask: would I buy this today at this price? If not, sell."},
  {topic:"Markets",q:"What is the VIX?",a:"The 'fear gauge' — measures expected 30-day S&P 500 volatility from options prices.",ex:"VIX > 30 = high fear. VIX < 15 = complacency.",app:"When VIX spikes, great investors get greedy."},
  {topic:"Investing",q:"What is duration risk in bonds?",a:"Bond price sensitivity to interest rate changes. Duration 8 = 8% price drop per 1% rate rise.",ex:"10-year Treasury bonds during 2022 rate hikes lost 15-20%.",app:"Rising rates kill long-duration bonds. Match duration to horizon."},
  {topic:"Behavioral",q:"What is anchoring bias?",a:"Fixating on a reference price when making decisions.",ex:"'I won't sell until it gets back to my £50 purchase price.'",app:"The stock doesn't know what you paid. Decisions need current fundamentals."},
  {topic:"Markets",q:"What is an inverted yield curve?",a:"Short-term yields exceeding long-term yields. Has predicted every US recession since 1955.",ex:"3-month Treasury yield > 10-year Treasury yield.",app:"Watch this. It's the best single recession predictor we have."},
  {topic:"Investing",q:"Rule of 72",a:"Divide 72 by your annual return to find years to double your money.",ex:"72 ÷ 8% = 9 years to double. 72 ÷ 12% = 6 years.",app:"Quick mental math for evaluating investment opportunities."},
  {topic:"Behavioral",q:"What is recency bias?",a:"Overweighting recent events when predicting the future.",ex:"Expecting markets to keep falling after a crash.",app:"Markets mean-revert. Yesterday's performance ≠ tomorrow's forecast."},
];

const MODULES = [
  {id:"pf",title:"Personal Finance",icon:"💰",color:"#00ff88",level:1,
   lessons:["The 50/30/20 Rule","Emergency Funds","Credit Scores","Inflation & Purchasing Power","Net Worth Tracking"],
   desc:"Build the foundation. Master budgeting, savings, and financial security."},
  {id:"inv",title:"Investing Fundamentals",icon:"📈",color:"#3b82f6",level:2,
   lessons:["Compound Interest","Index Funds & ETFs","Diversification","Risk vs Return","Asset Allocation"],
   desc:"Learn how money grows. Index funds, diversification, long-term thinking."},
  {id:"mkt",title:"Markets & Macro",icon:"🌍",color:"#f5a623",level:3,
   lessons:["How Markets Work","Bull & Bear Markets","Interest Rates","Inflation","Reading Economic Signals"],
   desc:"Understand the system. How macro forces move markets and your portfolio."},
  {id:"beh",title:"Behavioral Finance",icon:"🧠",color:"#a855f7",level:4,
   lessons:["Loss Aversion","FOMO & Panic Selling","Overconfidence","Anchoring","Building Decision Discipline"],
   desc:"Master your mind. The psychological mistakes that destroy wealth — and how to avoid them."},
  {id:"trd",title:"Trading & Strategies",icon:"⚡",color:"#ff3b5c",level:5,
   lessons:["Technical Analysis","Trend Following","Mean Reversion","Stop Losses","Position Sizing"],
   desc:"Advanced tools. Technical analysis, systematic strategies, risk management."},
];

/* ─── UTILS ──────────────────────────────────────────────────────────────────── */
const fmt = n => n >= 0 ? `£${Math.abs(n).toLocaleString()}` : `-£${Math.abs(n).toLocaleString()}`;
const clamp = (v,mn,mx) => Math.max(mn,Math.min(mx,v));
const rnd = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

/* ─── COMPONENTS ─────────────────────────────────────────────────────────────── */

const Tag = ({children,color="#00ff88"}) => (
  <span style={{fontFamily:"var(--fm)",fontSize:10,letterSpacing:2,textTransform:"uppercase",
    color,border:`1px solid ${color}33`,padding:"3px 8px",borderRadius:4}}>
    {children}
  </span>
);

const Stat = ({label,value,color="var(--t1)",sub}) => (
  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"14px 16px"}}>
    <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--t3)",textTransform:"uppercase",marginBottom:4}}>{label}</div>
    <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:700,color,lineHeight:1}}>{value}</div>
    {sub && <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginTop:4}}>{sub}</div>}
  </div>
);

const Btn = ({children,onClick,primary,danger,small,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:primary?"var(--g)":danger?"var(--red)":"var(--card)",
    color:primary||danger?"#000":"var(--t1)",
    border:`1px solid ${primary?"var(--g)":danger?"var(--red)":"var(--border)"}`,
    borderRadius:"var(--r)",padding:small?"8px 14px":"12px 20px",
    fontSize:small?13:15,fontWeight:600,
    fontFamily:"var(--fh)",letterSpacing:.5,
    transition:"all .15s",width:"100%",
    opacity:disabled?.5:1,
    ...style
  }}>{children}</button>
);

const EloBar = ({elo}) => {
  const pct = clamp((elo-500)/10,0,100);
  const col = elo>=1200?"var(--g)":elo>=900?"var(--amber)":"var(--red)";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",letterSpacing:1}}>ELO RATING</span>
        <span style={{fontFamily:"var(--fm)",fontSize:13,fontWeight:700,color:col}}>{elo}</span>
      </div>
      <div style={{background:"var(--border)",borderRadius:3,height:4,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:3,transition:"width .6s ease"}}/>
      </div>
    </div>
  );
};

const ProgressRing = ({pct,size=60,stroke=4,color="var(--g)",label}) => {
  const r = (size-stroke*2)/2, c = 2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} style={{position:"absolute",transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset .6s ease"}}/>
      </svg>
      <div style={{fontFamily:"var(--fm)",fontSize:12,fontWeight:700,color}}>{label||`${pct}%`}</div>
    </div>
  );
};

const MiniChart = ({data,color="var(--g)",height=60}) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data.map((v,i)=>({v,i}))} margin={{top:4,right:0,bottom:0,left:0}}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
          <stop offset="95%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#cg)" dot={false}/>
      <Tooltip contentStyle={{background:"var(--card)",border:"1px solid var(--border)",fontFamily:"var(--fm)",fontSize:11}} formatter={v=>[`${v}`,""]} labelFormatter={()=>""}/>
    </AreaChart>
  </ResponsiveContainer>
);

/* ─── SCREENS ─────────────────────────────────────────────────────────────────── */

/* DASHBOARD */
const Dashboard = ({gs,nav}) => {
  const {xp,level,streak,elo,badges,wealthHistory,completedModules} = gs;
  const xpNext = level*500, xpPct = Math.round(((xp%(level*500))/(level*500))*100);
  const eloLabel = elo>=1400?"Elite":elo>=1200?"Expert":elo>=900?"Advanced":elo>=600?"Intermediate":"Beginner";

  return (
    <div style={{padding:"0 0 80px"}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0c0c10 0%,#101018 60%,#080f0c 100%)",
        borderBottom:"1px solid var(--border)",padding:"24px 16px 20px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,
          background:"radial-gradient(circle,rgba(0,255,136,.06),transparent 70%)",borderRadius:"50%"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <Tag>Flight Simulator for Finance</Tag>
            <div style={{fontFamily:"var(--fh)",fontSize:30,fontWeight:700,color:"var(--t1)",marginTop:8,lineHeight:1.1}}>
              FinQuest
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)",marginTop:4}}>
              Level {level} · {eloLabel}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"var(--fm)",fontSize:22,fontWeight:700,color:"var(--g)",animation:"glow 3s ease infinite"}}>{elo}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2}}>ELO RATING</div>
          </div>
        </div>
        {/* XP bar */}
        <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2}}>XP {xp.toLocaleString()} / {(level*500).toLocaleString()}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--g)"}}>🔥 {streak} STREAK</span>
          </div>
          <div style={{background:"var(--border)",borderRadius:3,height:6,overflow:"hidden"}}>
            <div style={{width:`${xpPct}%`,height:"100%",background:"linear-gradient(90deg,var(--g),var(--g2))",borderRadius:3,transition:"width .6s"}}/>
          </div>
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          <Stat label="Net Worth" value={fmt(gs.netWorth)} color={gs.netWorth>=0?"var(--g)":"var(--red)"}/>
          <Stat label="Happiness" value={`${gs.happiness}`} color="var(--amber)" sub="/100"/>
          <Stat label="Modules" value={completedModules.length} sub={`/ ${MODULES.length}`}/>
        </div>

        {/* Quick actions */}
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:10}}>TRAIN NOW</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[
            {icon:"🎮",label:"Life Simulator",sub:"80 years · 16 rounds",screen:"game",color:"var(--g)"},
            {icon:"⏱",label:"Time Machine",sub:"Historical crashes",screen:"timemachine",color:"var(--amber)"},
            {icon:"🧪",label:"Decision Lab",sub:"Micro-scenarios",screen:"lab",color:"var(--blue)"},
            {icon:"📇",label:"Flashcards",sub:"Spaced repetition",screen:"cards",color:"#a855f7"},
          ].map(({icon,label,sub,screen,color})=>(
            <button key={screen} onClick={()=>nav(screen)} style={{
              background:"var(--card)",border:`1px solid var(--border)`,
              borderRadius:"var(--r)",padding:"14px 12px",textAlign:"left",
              cursor:"pointer",transition:"all .15s",
            }} onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.background="#14141a"}}
               onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--card)"}}>
              <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
              <div style={{fontFamily:"var(--fh)",fontSize:15,fontWeight:600,color:"var(--t1)"}}>{label}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginTop:2}}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Wealth chart */}
        {wealthHistory.length > 1 && <>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:8}}>WEALTH TRAJECTORY</div>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"12px 8px 4px"}}>
            <MiniChart data={wealthHistory} height={80}/>
          </div>
          <div style={{marginTop:16}}/>
        </>}

        {/* ELO bar */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:14,marginBottom:16}}>
          <EloBar elo={elo}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:12}}>
            {[["Risk Mgmt",gs.skillRisk],["Market IQ",gs.skillMarket],["Behaviour",gs.skillBeh]].map(([l,v])=>(
              <div key={l} style={{textAlign:"center"}}>
                <ProgressRing pct={v} size={48} stroke={3} label={`${v}`}/>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",marginTop:4,letterSpacing:1}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && <>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:8}}>BADGES</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
            {badges.map((b,i)=>(
              <div key={i} style={{background:"var(--card)",border:"1px solid var(--g)33",borderRadius:6,
                padding:"6px 10px",fontFamily:"var(--fm)",fontSize:11,color:"var(--g)"}}>
                {b}
              </div>
            ))}
          </div>
        </>}

        {/* Learning path */}
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:10}}>LEARNING PATH</div>
        {MODULES.map(m=>{
          const done = completedModules.includes(m.id);
          return (
            <button key={m.id} onClick={()=>nav("modules")} style={{
              display:"flex",alignItems:"center",gap:12,width:"100%",
              background:"var(--card)",border:`1px solid ${done?"var(--g)33":"var(--border)"}`,
              borderRadius:"var(--r)",padding:"12px 14px",marginBottom:8,cursor:"pointer",textAlign:"left"
            }}>
              <div style={{fontSize:20,width:32,textAlign:"center"}}>{m.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--fh)",fontSize:14,fontWeight:600,color:"var(--t1)"}}>
                  Lvl {m.level} · {m.title}
                </div>
                <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginTop:2}}>{m.lessons.length} lessons</div>
              </div>
              <div style={{fontFamily:"var(--fm)",fontSize:11,color:done?"var(--g)":"var(--t3)"}}>
                {done?"✓ Done":"→"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* LIFE GAME */
const LifeGame = ({gs,setGs,nav}) => {
  const [phase,setPhase] = useState(gs.gamePhase||"intro");
  const [roundIdx,setRoundIdx] = useState(gs.gameRound||0);
  const [chosen,setChosen] = useState(null);
  const event = LIFE_EVENTS[roundIdx];

  const choose = (ch) => {
    const nw = clamp(gs.netWorth+ch.nw,-500000,9999999);
    const hap = clamp(gs.happiness+ch.hap,0,100);
    const str = clamp(gs.stress+ch.str,0,100);
    const elo = clamp(gs.elo+ch.elo,100,3000);
    const wh = [...gs.wealthHistory, nw];
    const dl = [...(gs.decisionLog||[]), {age:event.age,event:event.title,choice:ch.t,nw}];
    // behavioral tracking
    const beh = {...(gs.behavior||{})};
    beh[ch.beh] = (beh[ch.beh]||0)+1;
    setGs(g=>({...g,netWorth:nw,happiness:hap,stress:str,elo,wealthHistory:wh,
      decisionLog:dl,behavior:beh,xp:g.xp+60,
      skillRisk:clamp(g.skillRisk+(ch.elo>0?2:-1),0,100),
      skillMarket:clamp(g.skillMarket+(ch.beh==="disciplined"?3:-1),0,100),
      skillBeh:clamp(g.skillBeh+(ch.beh==="panic"?-3:2),0,100),
    }));
    setChosen(ch);
  };

  const next = () => {
    if(roundIdx < LIFE_EVENTS.length-1){
      setRoundIdx(r=>r+1); setChosen(null);
    } else {
      setPhase("result");
      const beh = gs.behavior||{};
      const panic = beh.panic||0;
      const disciplined = beh.disciplined||0;
      const personality = panic>2?"😰 The Fearful Saver":disciplined>3?"🧘 The Long-Term Investor":beh.gambling>1?"🎲 The Speculator":"⚖️ The Balanced Builder";
      const newBadges = [...(gs.badges||[])];
      if(!newBadges.includes("🎮 Life Simulator")) newBadges.push("🎮 Life Simulator");
      if(gs.elo>=1200 && !newBadges.includes("⭐ Expert Investor")) newBadges.push("⭐ Expert Investor");
      setGs(g=>({...g,badges:newBadges,gamePhase:"done",xp:g.xp+300,personality}));
    }
  };

  if(phase==="intro") return (
    <div style={{padding:"24px 16px",paddingBottom:80}} className="fade-up">
      <div style={{textAlign:"center",padding:"32px 0"}}>
        <div style={{fontSize:56,marginBottom:12}}>🎮</div>
        <div style={{fontFamily:"var(--fh)",fontSize:32,fontWeight:700,color:"var(--t1)",marginBottom:8}}>
          The 80-Year Game
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--t3)",marginBottom:24,lineHeight:1.6}}>
          Live your entire financial life<br/>in 10 rounds · 5 years each
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
          {[["⚡","Real Events","Job loss, crashes, windfalls"],["📊","3 Scores","Net Worth · Happiness · Stress"],
            ["🧠","ELO Impact","Every choice changes your rating"],["📋","Life Report","Behavioral analysis at the end"]].map(([ic,t,d])=>(
            <div key={t} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"14px 12px",textAlign:"left"}}>
              <div style={{fontSize:20,marginBottom:6}}>{ic}</div>
              <div style={{fontFamily:"var(--fh)",fontSize:13,fontWeight:600,color:"var(--t1)"}}>{t}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginTop:2}}>{d}</div>
            </div>
          ))}
        </div>
        <Btn primary onClick={()=>setPhase("playing")}>Begin My Financial Life</Btn>
        <div style={{marginTop:12}}><Btn onClick={()=>nav("dashboard")}>← Back</Btn></div>
      </div>
    </div>
  );

  if(phase==="result") {
    const grade = gs.elo>=1400?"S":gs.elo>=1200?"A":gs.elo>=900?"B":gs.elo>=600?"C":"D";
    const gCol = grade==="S"?"var(--g)":grade==="A"?"#3b82f6":grade==="B"?"var(--amber)":"var(--red)";
    return (
      <div style={{padding:"16px",paddingBottom:80}} className="fade-up">
        <div style={{textAlign:"center",padding:"24px 0"}}>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2}}>GAME OVER · AGE 80</div>
          <div style={{fontFamily:"var(--fh)",fontSize:80,fontWeight:700,color:gCol,lineHeight:1}}>{grade}</div>
          <div style={{fontFamily:"var(--fh)",fontSize:18,color:"var(--t1)",marginBottom:4}}>{gs.personality||"The Builder"}</div>
          <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--t3)"}}>Final ELO: {gs.elo}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          <Stat label="Net Worth" value={fmt(gs.netWorth)} color={gs.netWorth>=0?"var(--g)":"var(--red)"}/>
          <Stat label="Happiness" value={gs.happiness} color="var(--amber)"/>
          <Stat label="Stress" value={gs.stress} color="var(--red)"/>
        </div>
        {/* Behavioral breakdown */}
        {(() => {
          const beh = gs.behavior||{};
          const panic = beh.panic||0, disc = beh.disciplined||0, risk = (beh.high_risk||0)+(beh.gambling||0);
          const finIQ = clamp(50+disc*8+((beh.balanced||0)*5)-panic*12,0,100);
          const riskDisc = clamp(70-risk*10+disc*5,0,100);
          const ltThink = clamp(50+disc*10+((beh.analytical||0)*6),0,100);
          return (
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:14,marginBottom:16}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:12}}>BEHAVIORAL ANALYSIS</div>
              {[["Financial IQ",finIQ,"var(--g)"],["Risk Discipline",riskDisc,"var(--blue)"],["Long-Term Thinking",ltThink,"var(--amber)"]].map(([l,v,c])=>(
                <div key={l} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t2)"}}>{l}</span>
                    <span style={{fontFamily:"var(--fm)",fontSize:11,color:c}}>{v}/100</span>
                  </div>
                  <div style={{background:"var(--border)",borderRadius:3,height:4}}>
                    <div style={{width:`${v}%`,height:"100%",background:c,borderRadius:3,transition:"width .6s"}}/>
                  </div>
                </div>
              ))}
              {panic>0 && <div style={{background:"#ff3b5c11",border:"1px solid #ff3b5c33",borderRadius:6,padding:10,marginTop:8,fontFamily:"var(--fm)",fontSize:11,color:"#ff8099"}}>
                ⚠️ Panic sold {panic}× · Investors who stayed invested earned 3× more
              </div>}
            </div>
          );
        })()}
        {/* Decision log */}
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:8}}>YOUR 60-YEAR JOURNEY</div>
        {(gs.decisionLog||[]).map((d,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid var(--border)",padding:"10px 0",gap:8}}>
            <div>
              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--g)"}}>Age {d.age} · {d.event}</div>
              <div style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--t2)",marginTop:2}}>{d.choice}</div>
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:12,color:d.nw>=0?"var(--g)":"var(--red)",whiteSpace:"nowrap"}}>{fmt(d.nw)}</div>
          </div>
        ))}
        <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Btn onClick={()=>{setPhase("intro");setRoundIdx(0);setChosen(null);}}>Play Again</Btn>
          <Btn primary onClick={()=>nav("dashboard")}>Dashboard</Btn>
        </div>
      </div>
    );
  }

  const prog = Math.round((roundIdx/LIFE_EVENTS.length)*100);
  const typeColor = {risk:"var(--red)",opp:"var(--g)",decision:"var(--amber)"}[event.type]||"var(--g)";

  return (
    <div style={{padding:"16px",paddingBottom:80}} className="fade-up">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{fontFamily:"var(--fh)",fontSize:18,fontWeight:700,color:"var(--t1)"}}>Age {event.age}</div>
          <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)"}}>Round {roundIdx+1}/{LIFE_EVENTS.length} · {event.era}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"var(--fm)",fontSize:16,fontWeight:700,color:"var(--g)"}}>{gs.elo}</div>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:1}}>ELO</div>
        </div>
      </div>
      {/* Progress */}
      <div style={{background:"var(--border)",borderRadius:3,height:4,marginBottom:12,overflow:"hidden"}}>
        <div style={{width:`${prog}%`,height:"100%",background:"linear-gradient(90deg,var(--g),var(--amber))",transition:"width .5s"}}/>
      </div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
        <Stat label="Worth" value={fmt(gs.netWorth)} color={gs.netWorth>=0?"var(--g)":"var(--red)"}/>
        <Stat label="Happy" value={gs.happiness} color="var(--amber)"/>
        <Stat label="Stress" value={gs.stress} color="var(--red)"/>
      </div>
      {/* Event */}
      <div style={{background:"var(--card)",border:`1px solid var(--border)`,borderLeft:`3px solid ${typeColor}`,
        borderRadius:"var(--r)",padding:"18px 16px",marginBottom:14}} className="fade-up">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:28}}>{event.icon}</span>
          <div>
            <Tag color={typeColor}>{event.type}</Tag>
            <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:700,color:"var(--t1)",marginTop:4}}>{event.title}</div>
          </div>
        </div>
        <div style={{fontFamily:"var(--fb)",fontSize:14,color:"var(--t2)",lineHeight:1.6}}>{event.desc}</div>
      </div>

      {!chosen ? (
        <>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:8}}>WHAT DO YOU DO?</div>
          {event.choices.map((ch,i)=>{
            const dc = ch.nw>0?"var(--g)":ch.nw<0?"var(--red)":"var(--t3)";
            return (
              <button key={i} onClick={()=>choose(ch)} style={{
                display:"block",width:"100%",background:"var(--card)",
                border:"1px solid var(--border)",borderRadius:"var(--r)",
                padding:"14px",marginBottom:8,textAlign:"left",cursor:"pointer",
                transition:"all .15s"
              }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=typeColor}
              onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{fontFamily:"var(--fb)",fontSize:14,color:"var(--t1)",lineHeight:1.4}}>{ch.t}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:11,color:dc,whiteSpace:"nowrap"}}>
                    {ch.nw>0?"▲":ch.nw<0?"▼":"—"} {fmt(Math.abs(ch.nw))}
                  </div>
                </div>
              </button>
            );
          })}
        </>
      ) : (
        <div className="fade-up">
          <div style={{background:"#00ff8811",border:"1px solid #00ff8833",borderRadius:"var(--r)",padding:16,marginBottom:12}}>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--g)",letterSpacing:2,marginBottom:6}}>OUTCOME</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:10}}>
              {[["NW",chosen.nw,chosen.nw>=0?"var(--g)":"var(--red)"],
                ["Happiness",chosen.hap,chosen.hap>=0?"var(--g)":"var(--red)"],
                ["Stress",chosen.str,chosen.str>0?"var(--red)":"var(--g)"],
                ["ELO",chosen.elo,chosen.elo>=0?"var(--g)":"var(--red)"]].map(([l,v,c])=>(
                <div key={l} style={{fontFamily:"var(--fm)",fontSize:12,color:c}}>
                  {l}: {v>0?"+":""}{l==="NW"?fmt(v):v}
                </div>
              ))}
            </div>
            <div style={{background:"var(--card)",borderLeft:"2px solid var(--g)",padding:"10px 12px",borderRadius:6}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--g)",letterSpacing:1,marginBottom:4}}>💡 LESSON</div>
              <div style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--t2)",lineHeight:1.5}}>{chosen.lesson}</div>
            </div>
          </div>
          <Btn primary onClick={next}>
            {roundIdx<LIFE_EVENTS.length-1?`Age ${LIFE_EVENTS[roundIdx+1].age} →`:"See Life Results 🏁"}
          </Btn>
        </div>
      )}
    </div>
  );
};

/* TIME MACHINE */
const TimeMachine = ({gs,setGs,nav}) => {
  const [selected,setSelected] = useState(null);
  const [chosen,setChosen] = useState(null);
  const [scenario,setScenario] = useState(null);

  const pick = (s) => { setScenario(s); setSelected(null); setChosen(null); };

  const submit = () => {
    if(selected===null) return;
    const opt = scenario.options[selected];
    setChosen(opt);
    const eloDelta = opt.elo;
    setGs(g=>({...g,
      elo:clamp(g.elo+eloDelta,100,3000),
      xp:g.xp+80,
      skillMarket:clamp(g.skillMarket+(eloDelta>0?4:-2),0,100),
      badges:opt.elo>=40&&!g.badges.includes("⏱ Time Traveler")?[...g.badges,"⏱ Time Traveler"]:g.badges
    }));
  };

  if(!scenario) return (
    <div style={{padding:"16px",paddingBottom:80}}>
      <div style={{fontFamily:"var(--fh)",fontSize:24,fontWeight:700,marginBottom:4}}>⏱ Time Machine</div>
      <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)",marginBottom:20}}>
        Jump into historical crashes. No future knowledge. Real decisions.
      </div>
      {TIME_MACHINE.map(s=>(
        <button key={s.id} onClick={()=>pick(s)} style={{
          display:"block",width:"100%",background:"var(--card)",
          border:`1px solid var(--border)`,borderLeft:`3px solid ${s.color}`,
          borderRadius:"var(--r)",padding:"16px 14px",marginBottom:10,
          textAlign:"left",cursor:"pointer",transition:"all .15s"
        }}
        onMouseEnter={e=>e.currentTarget.style.background="#14141a"}
        onMouseLeave={e=>e.currentTarget.style.background="var(--card)"}>
          <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
          <div style={{fontFamily:"var(--fh)",fontSize:16,fontWeight:700,color:"var(--t1)",marginBottom:4}}>{s.title}</div>
          <div style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t3)",lineHeight:1.5}}>{s.setup.substring(0,80)}…</div>
        </button>
      ))}
      <Btn onClick={()=>nav("dashboard")} style={{marginTop:8}}>← Back</Btn>
    </div>
  );

  return (
    <div style={{padding:"16px",paddingBottom:80}} className="fade-up">
      <button onClick={()=>setScenario(null)} style={{background:"none",color:"var(--t3)",fontFamily:"var(--fm)",fontSize:11,marginBottom:12,display:"flex",alignItems:"center",gap:4}}>← All scenarios</button>
      <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:700,color:"var(--t1)",marginBottom:4}}>{scenario.title}</div>
      <div style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:14,
        background:"var(--card)",border:`1px solid ${scenario.color}33`,borderLeft:`3px solid ${scenario.color}`,
        borderRadius:"var(--r)",padding:"14px 12px"}}>
        {scenario.setup}
      </div>
      {/* Chart */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"12px 8px 4px",marginBottom:14}}>
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:4,paddingLeft:4}}>PRICE INDEX</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={scenario.data.map((v,i)=>({v,i}))} margin={{top:4,right:0,bottom:0,left:0}}>
            <defs>
              <linearGradient id="tmg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scenario.color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={scenario.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={scenario.color} strokeWidth={2} fill="url(#tmg)" dot={false}/>
            <ReferenceLine x={scenario.marker} stroke="#f5a623" strokeDasharray="3 3"
              label={{value:"⚡ You are here",fill:"#f5a623",fontSize:10,fontFamily:"JetBrains Mono"}}/>
            <YAxis domain={['auto','auto']} tick={{fill:"var(--t3)",fontSize:9,fontFamily:"JetBrains Mono"}} width={28}/>
            <Tooltip contentStyle={{background:"var(--card)",border:"1px solid var(--border)",fontFamily:"JetBrains Mono",fontSize:10}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!chosen ? (
        <>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)",letterSpacing:2,marginBottom:8}}>YOUR MOVE?</div>
          {scenario.options.map((o,i)=>(
            <button key={i} onClick={()=>setSelected(i)} style={{
              display:"block",width:"100%",background:selected===i?"#00ff8811":"var(--card)",
              border:`1px solid ${selected===i?"var(--g)":"var(--border)"}`,
              borderRadius:"var(--r)",padding:"13px 14px",marginBottom:8,textAlign:"left",cursor:"pointer"
            }}>
              <div style={{fontFamily:"var(--fb)",fontSize:14,color:"var(--t1)"}}>{o.t}</div>
            </button>
          ))}
          <Btn primary onClick={submit} disabled={selected===null} style={{marginTop:4}}>
            Submit Decision →
          </Btn>
        </>
      ) : (
        <div className="fade-up">
          <div style={{background:"var(--card)",border:`1px solid ${scenario.color}33`,
            borderLeft:`3px solid ${scenario.color}`,borderRadius:"var(--r)",padding:16,marginBottom:12}}>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:scenario.color,letterSpacing:2,marginBottom:6}}>WHAT HAPPENED NEXT</div>
            <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:700,
              color:chosen.outcome>=0?"var(--g)":"var(--red)",marginBottom:8}}>
              {chosen.outcome>=0?"+":""}{chosen.outcome}% return
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:chosen.elo>=0?"var(--g)":"var(--red)",marginBottom:10}}>
              ELO: {chosen.elo>=0?"+":""}{chosen.elo}
            </div>
            <div style={{fontFamily:"var(--fb)",fontSize:14,color:"var(--t2)",lineHeight:1.6}}>{chosen.insight}</div>
          </div>
          {/* Best option */}
          {(() => {
            const best = scenario.options.reduce((a,b)=>b.elo>a.elo?b:a);
            if(chosen.t!==best.t) return (
              <div style={{background:"#3b82f611",border:"1px solid #3b82f633",borderRadius:"var(--r)",padding:12,marginBottom:12}}>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--blue)",letterSpacing:2,marginBottom:4}}>OPTIMAL PLAY</div>
                <div style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--t2)"}}>✓ {best.t}</div>
                <div style={{fontFamily:"var(--fb)",fontSize:12,color:"var(--t3)",marginTop:4}}>{best.insight}</div>
              </div>
            );
          })()}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Btn onClick={()=>setScenario(null)}>Try Another</Btn>
            <Btn primary onClick={()=>nav("dashboard")}>Dashboard</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

/* DECISION LAB */
const DecisionLab = ({gs,setGs,nav}) => {
  const [idx,setIdx] = useState(0);
  const [chosen,setChosen] = useState(null);
  const [score,setScore] = useState(0);
  const [done,setDone] = useState(false);
  const q = DECISION_LAB[idx];

  const answer = (i) => {
    if(chosen!==null) return;
    setChosen(i);
    const isCorrect = i===q.correct||i===q.expert;
    if(isCorrect) setScore(s=>s+1);
    const eloDelta = q.elo[i]||0;
    setGs(g=>({...g,elo:clamp(g.elo+eloDelta,100,3000),xp:g.xp+40,
      skillBeh:clamp(g.skillBeh+(isCorrect?3:-1),0,100)}));
  };

  const next = () => {
    if(idx<DECISION_LAB.length-1){setIdx(i=>i+1);setChosen(null);}
    else setDone(true);
  };

  if(done) return (
    <div style={{padding:"16px",paddingBottom:80,textAlign:"center"}} className="fade-up">
      <div style={{padding:"40px 0"}}>
        <div style={{fontFamily:"var(--fh)",fontSize:64,fontWeight:700,color:"var(--g)",marginBottom:8}}>
          {score}/{DECISION_LAB.length}
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--t3)",marginBottom:24}}>
          Decision Lab complete · +{score*40} XP
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Btn onClick={()=>{setIdx(0);setChosen(null);setScore(0);setDone(false);}}>Retry</Btn>
          <Btn primary onClick={()=>nav("dashboard")}>Dashboard</Btn>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{padding:"16px",paddingBottom:80}} className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:700}}>🧪 Decision Lab</div>
          <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)"}}>Scenario {idx+1}/{DECISION_LAB.length}</div>
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:14,fontWeight:700,color:"var(--g)"}}>{score}/{idx} ✓</div>
      </div>

      <div style={{background:"var(--card)",border:"1px solid var(--blue)33",borderLeft:"3px solid var(--blue)",
        borderRadius:"var(--r)",padding:"16px 14px",marginBottom:14}}>
        <div style={{fontFamily:"var(--fh)",fontSize:17,fontWeight:600,color:"var(--t1)",lineHeight:1.4,marginBottom:8}}>{q.q}</div>
        <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",lineHeight:1.5}}>{q.ctx}</div>
      </div>

      {q.opts.map((o,i)=>{
        let bg="var(--card)",bc="var(--border)",tc="var(--t1)";
        if(chosen!==null){
          if(i===q.correct||i===q.expert){bg="#00ff8811";bc="var(--g)";tc="var(--g)";}
          else if(i===chosen){bg="#ff3b5c11";bc="var(--red)";tc="var(--red)";}
        }
        return (
          <button key={i} onClick={()=>answer(i)} style={{
            display:"block",width:"100%",background:bg,border:`1px solid ${bc}`,
            borderRadius:"var(--r)",padding:"13px 14px",marginBottom:8,
            textAlign:"left",cursor:chosen!==null?"default":"pointer",
            transition:"all .2s",fontFamily:"var(--fb)",fontSize:14,color:tc
          }}>
            {o}
          </button>
        );
      })}

      {chosen!==null && (
        <div className="fade-up" style={{background:"var(--card)",border:"1px solid var(--border)",
          borderRadius:"var(--r)",padding:14,marginBottom:12}}>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--g)",letterSpacing:2,marginBottom:6}}>OUTCOME</div>
          <div style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>{q.outcome}</div>
          <Btn primary onClick={next}>
            {idx<DECISION_LAB.length-1?"Next Scenario →":"See Results 🏁"}
          </Btn>
        </div>
      )}
    </div>
  );
};

/* FLASHCARDS */
const Flashcards = ({gs,setGs,nav}) => {
  const [idx,setIdx] = useState(0);
  const [flipped,setFlipped] = useState(false);
  const [filter,setFilter] = useState("All");
  const [diff,setDiff] = useState({});
  const topics = ["All",...[...new Set(FLASHCARDS.map(f=>f.topic))]];
  const cards = filter==="All"?FLASHCARDS:FLASHCARDS.filter(f=>f.topic===filter);
  const card = cards[idx%cards.length];
  const topicColors = {Investing:"var(--g)",Behavioral:"var(--amber)",Markets:"var(--blue)"};
  const tc = topicColors[card.topic]||"var(--t2)";

  const rate = (d) => {
    setDiff(p=>({...p,[card.q]:d}));
    setFlipped(false);
    setIdx(i=>(i+1)%cards.length);
    setGs(g=>({...g,xp:g.xp+(d===1?15:d===2?8:4)}));
  };

  return (
    <div style={{padding:"16px",paddingBottom:80}}>
      <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:700,marginBottom:4}}>📇 Flashcards</div>
      <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginBottom:14}}>
        Spaced repetition · Hard cards reappear more
      </div>
      {/* Topic filter */}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {topics.map(t=>(
          <button key={t} onClick={()=>{setFilter(t);setIdx(0);setFlipped(false);}} style={{
            background:filter===t?"var(--g)":"var(--card)",
            color:filter===t?"#000":"var(--t2)",
            border:`1px solid ${filter===t?"var(--g)":"var(--border)"}`,
            borderRadius:99,padding:"5px 12px",fontFamily:"var(--fm)",fontSize:11,whiteSpace:"nowrap",cursor:"pointer"
          }}>{t}</button>
        ))}
      </div>
      {/* Card */}
      <div onClick={()=>setFlipped(f=>!f)} style={{
        background:"var(--card)",border:`1px solid ${tc}33`,borderLeft:`3px solid ${tc}`,
        borderRadius:"var(--r)",padding:"28px 20px",minHeight:200,cursor:"pointer",
        display:"flex",flexDirection:"column",justifyContent:"center",
        marginBottom:12,transition:"all .2s",position:"relative"
      }}>
        <Tag color={tc}>{card.topic}</Tag>
        {!flipped ? (
          <div style={{marginTop:12}}>
            <div style={{fontFamily:"var(--fh)",fontSize:18,fontWeight:600,color:"var(--t1)",lineHeight:1.4,marginBottom:12}}>{card.q}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)"}}>Tap to reveal →</div>
          </div>
        ) : (
          <div style={{marginTop:12}} className="fade-up">
            <div style={{fontFamily:"var(--fh)",fontSize:16,fontWeight:600,color:"var(--t1)",marginBottom:10}}>{card.a}</div>
            <div style={{background:"var(--surface)",borderRadius:6,padding:"8px 10px",marginBottom:6}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--amber)",letterSpacing:1,marginBottom:3}}>EXAMPLE</div>
              <div style={{fontFamily:"var(--fb)",fontSize:12,color:"var(--t2)"}}>{card.ex}</div>
            </div>
            <div style={{background:"var(--surface)",borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--g)",letterSpacing:1,marginBottom:3}}>APPLY IT</div>
              <div style={{fontFamily:"var(--fb)",fontSize:12,color:"var(--t2)"}}>{card.app}</div>
            </div>
          </div>
        )}
        <div style={{position:"absolute",bottom:10,right:12,fontFamily:"var(--fm)",fontSize:9,color:"var(--t3)"}}>
          {(idx%cards.length)+1}/{cards.length}
        </div>
      </div>

      {flipped ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {[[1,"Easy","var(--g)"],[2,"Got it","var(--amber)"],[3,"Hard","var(--red)"]].map(([d,l,c])=>(
            <button key={d} onClick={()=>rate(d)} style={{
              background:"var(--card)",border:`1px solid ${c}44`,borderRadius:"var(--r)",
              padding:"10px 6px",fontFamily:"var(--fm)",fontSize:11,color:c,cursor:"pointer"
            }}>{l}</button>
          ))}
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Btn onClick={()=>setIdx(i=>(i-1+cards.length)%cards.length)}>← Prev</Btn>
          <Btn primary onClick={()=>setFlipped(true)}>Reveal Answer</Btn>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:12}}>
        <Stat label="Total" value={FLASHCARDS.length}/>
        <Stat label="Mastered" value={Object.values(diff).filter(v=>v===1).length} color="var(--g)"/>
        <Stat label="Review" value={Object.values(diff).filter(v=>v===3).length} color="var(--red)"/>
      </div>
    </div>
  );
};

/* MODULES */
const Modules = ({gs,setGs,nav}) => {
  const [active,setActive] = useState(null);
  const [lessonIdx,setLessonIdx] = useState(0);

  if(!active) return (
    <div style={{padding:"16px",paddingBottom:80}}>
      <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:700,marginBottom:4}}>📚 Modules</div>
      <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginBottom:16}}>
        Progressive finance education. Complete modules to unlock simulations.
      </div>
      {MODULES.map(m=>{
        const done = gs.completedModules.includes(m.id);
        return (
          <button key={m.id} onClick={()=>{setActive(m);setLessonIdx(0);}} style={{
            display:"flex",gap:12,width:"100%",background:"var(--card)",
            border:`1px solid ${done?m.color+"44":"var(--border)"}`,borderLeft:`3px solid ${m.color}`,
            borderRadius:"var(--r)",padding:"14px",marginBottom:10,textAlign:"left",cursor:"pointer"
          }}>
            <div style={{fontSize:26,width:36,flexShrink:0,textAlign:"center"}}>{m.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:"var(--fh)",fontSize:15,fontWeight:700,color:"var(--t1)"}}>
                  Lvl {m.level} · {m.title}
                </div>
                {done && <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--g)"}}>✓</span>}
              </div>
              <div style={{fontFamily:"var(--fb)",fontSize:12,color:"var(--t3)",marginTop:4,lineHeight:1.5}}>{m.desc}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginTop:6}}>{m.lessons.length} lessons</div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const done = lessonIdx >= active.lessons.length;
  return (
    <div style={{padding:"16px",paddingBottom:80}} className="fade-up">
      <button onClick={()=>setActive(null)} style={{background:"none",color:"var(--t3)",fontFamily:"var(--fm)",fontSize:11,marginBottom:12}}>← All modules</button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <span style={{fontSize:24}}>{active.icon}</span>
        <div>
          <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:700,color:"var(--t1)"}}>{active.title}</div>
          <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)"}}>Lesson {Math.min(lessonIdx+1,active.lessons.length)} of {active.lessons.length}</div>
        </div>
      </div>
      {/* Progress dots */}
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {active.lessons.map((_,i)=>(
          <div key={i} style={{height:4,flex:1,borderRadius:2,
            background:i<lessonIdx?"var(--g)":i===lessonIdx?active.color:"var(--border)",transition:"background .3s"}}/>
        ))}
      </div>

      {!done ? (
        <div>
          <div style={{background:"var(--card)",border:`1px solid ${active.color}33`,borderLeft:`3px solid ${active.color}`,
            borderRadius:"var(--r)",padding:"20px 16px",marginBottom:14}}>
            <Tag color={active.color}>Lesson {lessonIdx+1}</Tag>
            <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:700,color:"var(--t1)",marginTop:8,marginBottom:12}}>
              {active.lessons[lessonIdx]}
            </div>
            <div style={{fontFamily:"var(--fb)",fontSize:14,color:"var(--t2)",lineHeight:1.8}}>
              This lesson covers the core principles of <strong style={{color:"var(--t1)"}}>{active.lessons[lessonIdx].toLowerCase()}</strong>.
              Understanding this concept is fundamental to making better financial decisions and building long-term wealth.
              Take time to internalize this — it compounds with everything you learn next.
            </div>
          </div>
          <Btn primary onClick={()=>{setLessonIdx(i=>i+1);setGs(g=>({...g,xp:g.xp+25}));}}>
            {lessonIdx<active.lessons.length-1?"Next Lesson →":"Complete Module 🎯"}
          </Btn>
        </div>
      ) : (
        <div className="fade-up" style={{textAlign:"center",padding:"32px 0"}}>
          <div style={{fontSize:52,marginBottom:12}}>🎯</div>
          <div style={{fontFamily:"var(--fh)",fontSize:28,fontWeight:700,color:"var(--g)",marginBottom:8}}>Module Complete!</div>
          <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--t3)",marginBottom:24}}>+200 XP · +{active.title} badge</div>
          <Btn primary onClick={()=>{
            const newMods = gs.completedModules.includes(active.id)?gs.completedModules:[...gs.completedModules,active.id];
            const newBadges = gs.badges.includes(`📚 ${active.title}`)?gs.badges:[...gs.badges,`📚 ${active.title}`];
            setGs(g=>({...g,completedModules:newMods,badges:newBadges,xp:g.xp+200}));
            setActive(null);
          }}>← Back to Modules</Btn>
        </div>
      )}
    </div>
  );
};

/* SIMULATOR */
const Simulator = ({nav}) => {
  const [age,setAge] = useState(25);
  const [monthly,setMonthly] = useState(500);
  const [rate,setRate] = useState(8);

  const simulate = (mo,r,yrs) => {
    let v=0,out=[];
    for(let y=0;y<yrs;y++){for(let m=0;m<12;m++)v=v*(1+r/100/12)+mo;out.push(Math.round(v));}
    return out;
  };

  const yrs = Math.max(1,65-age);
  const base = simulate(monthly,rate,yrs);
  const early = simulate(monthly,rate,yrs+10);
  const late = simulate(monthly,rate,Math.max(1,yrs-10));
  const ages = Array.from({length:yrs},(_,i)=>age+i);

  const chartData = ages.map((a,i)=>({age:a,base:base[i]||0,early:early[i]||0,late:late[i]||0}));

  return (
    <div style={{padding:"16px",paddingBottom:80}}>
      <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:700,marginBottom:4}}>📊 Wealth Simulator</div>
      <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",marginBottom:16}}>See long-term impact before making decisions.</div>

      {/* Inputs */}
      {[
        {label:"Your Age",val:age,set:setAge,min:18,max:60,step:1,suffix:"yrs"},
        {label:"Monthly Investment",val:monthly,set:setMonthly,min:50,max:5000,step:50,suffix:"£"},
        {label:"Annual Return",val:rate,set:setRate,min:3,max:15,step:1,suffix:"%"},
      ].map(({label,val,set,min,max,step,suffix})=>(
        <div key={label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:12,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--t3)",letterSpacing:1}}>{label}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:13,fontWeight:700,color:"var(--g)"}}>{suffix==="£"?`£${val.toLocaleString()}`:val}{suffix!=="£"?suffix:""}</span>
          </div>
          <input type="range" min={min} max={max} step={step} value={val} onChange={e=>set(+e.target.value)}
            style={{width:"100%",accentColor:"var(--g)"}}/>
        </div>
      ))}

      {/* Key numbers */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"16px 0"}}>
        <Stat label="At 65" value={`£${Math.round((base[base.length-1]||0)/1000)}K`} color="var(--g)"/>
        <Stat label="10yr earlier" value={`£${Math.round((early[early.length-1]||0)/1000)}K`} color="var(--amber)"/>
        <Stat label="10yr later" value={`£${Math.round((late[late.length-1]||0)/1000)}K`} color="var(--red)"/>
      </div>

      {/* Chart */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"12px 4px 4px"}}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:4}}>
            <defs>
              {[["cg1","var(--g)",.2],["cg2","var(--amber)",.1],["cg3","var(--red)",.08]].map(([id,c,o])=>(
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={o}/>
                  <stop offset="95%" stopColor={c} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="age" tick={{fill:"var(--t3)",fontSize:9,fontFamily:"JetBrains Mono"}}/>
            <YAxis tickFormatter={v=>`£${Math.round(v/1000)}K`} tick={{fill:"var(--t3)",fontSize:9,fontFamily:"JetBrains Mono"}} width={50}/>
            <Tooltip formatter={v=>[`£${Math.round(v).toLocaleString()}`,""]}
              contentStyle={{background:"var(--card)",border:"1px solid var(--border)",fontFamily:"JetBrains Mono",fontSize:10}}/>
            <Area type="monotone" dataKey="base" stroke="var(--g)" strokeWidth={2} fill="url(#cg1)" name="Base"/>
            <Area type="monotone" dataKey="early" stroke="var(--amber)" strokeWidth={1.5} fill="url(#cg2)" strokeDasharray="4 2" name="10yr Earlier"/>
            <Area type="monotone" dataKey="late" stroke="var(--red)" strokeWidth={1.5} fill="url(#cg3)" strokeDasharray="4 2" name="10yr Later"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      <div style={{background:"var(--g)0a",border:"1px solid var(--g)22",borderRadius:"var(--r)",padding:12,marginTop:12}}>
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--g)",letterSpacing:2,marginBottom:4}}>💡 KEY INSIGHT</div>
        <div style={{fontFamily:"var(--fb)",fontSize:13,color:"var(--t2)",lineHeight:1.6}}>
          Starting 10 years earlier adds <strong style={{color:"var(--g)"}}>
            £{Math.round(((early[early.length-1]||0)-(base[base.length-1]||0))/1000)}K
          </strong> to your retirement. The Rule of 72: at {rate}% your money doubles every{" "}
          <strong style={{color:"var(--g)"}}>{Math.round(72/rate)} years</strong>.
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN APP ────────────────────────────────────────────────────────────────── */
const INIT_STATE = {
  xp:0,level:1,streak:3,elo:800,
  netWorth:25000,happiness:50,stress:20,
  badges:[],completedModules:[],
  wealthHistory:[25000],decisionLog:[],
  behavior:{},gamePhase:"intro",gameRound:0,
  skillRisk:40,skillMarket:35,skillBeh:30,
  personality:null,
};

export default function App() {
  const [screen,setScreen] = useState("dashboard");
  const [gs,setGs] = useState(INIT_STATE);

  const nav = useCallback((s)=>setScreen(s),[]);

  const NAV_ITEMS = [
    {id:"dashboard",icon:"⚡",label:"Home"},
    {id:"game",icon:"🎮",label:"Life"},
    {id:"timemachine",icon:"⏱",label:"Time"},
    {id:"lab",icon:"🧪",label:"Lab"},
    {id:"cards",icon:"📇",label:"Cards"},
    {id:"simulator",icon:"📊",label:"Sim"},
    {id:"modules",icon:"📚",label:"Learn"},
  ];

  return (
    <>
      <FontLink/>
      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",position:"relative",background:"var(--bg)"}}>
        {/* Screen */}
        <div style={{minHeight:"calc(100vh - 64px)"}}>
          {screen==="dashboard"  && <Dashboard gs={gs} nav={nav}/>}
          {screen==="game"       && <LifeGame gs={gs} setGs={setGs} nav={nav}/>}
          {screen==="timemachine"&& <TimeMachine gs={gs} setGs={setGs} nav={nav}/>}
          {screen==="lab"        && <DecisionLab gs={gs} setGs={setGs} nav={nav}/>}
          {screen==="cards"      && <Flashcards gs={gs} setGs={setGs} nav={nav}/>}
          {screen==="simulator"  && <Simulator nav={nav}/>}
          {screen==="modules"    && <Modules gs={gs} setGs={setGs} nav={nav}/>}
        </div>

        {/* Bottom nav */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,background:"var(--surface)",
          borderTop:"1px solid var(--border)",display:"flex",zIndex:100}}>
          {NAV_ITEMS.map(({id,icon,label})=>{
            const active = screen===id;
            return (
              <button key={id} onClick={()=>nav(id)} style={{
                flex:1,padding:"10px 0 8px",background:"none",
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                borderTop:`2px solid ${active?"var(--g)":"transparent"}`,
                transition:"all .15s"
              }}>
                <span style={{fontSize:18}}>{icon}</span>
                <span style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:.5,
                  color:active?"var(--g)":"var(--t3)",fontWeight:active?700:400}}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
//halo